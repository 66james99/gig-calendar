package performers

import (
	"context"
	"database/sql"
	"sort"
	"strings"

	"github.com/66james99/gig-calendar/internal/database"
	// "github.com/66james99/gig-calendar/internal/dbcollection"
	"github.com/66james99/gig-calendar/internal/metadata"
	// "github.com/66james99/gig-calendar/internal/metadata/images"
)

// PerformerMatchResult holds the result of a performer matching operation.
type PerformerMatchResult struct {
	Name       string `json:"name"`
	Match      string `json:"match,omitempty"`
	Confidence int    `json:"confidence"`
	Pattern    string `json:"pattern,omitempty"`
}

// PerformerMatch checks for the existence of a performer in the database.
// It returns a confidence score:
// 100: Exact match in performer table
// 75:  Match in performer_alias table
// 50:  Fuzzy match against performer table
// 25:  Fuzzy match against performer_alias table
// 0:   No match
func PerformerMatch(ctx context.Context, q *database.Queries, rawPerformer string) (PerformerMatchResult, error) {
	normalized := metadata.Normalize(rawPerformer)
	if normalized == "" {
		return PerformerMatchResult{Confidence: 0}, nil
	}

	// 1. Exact match in Performer table
	p, err := q.GetPerformerByName(ctx, normalized)
	if err == nil {
		return PerformerMatchResult{Name: p.Name, Match: p.Name, Confidence: 100}, nil
	} else if err != sql.ErrNoRows {
		return PerformerMatchResult{}, err
	}

	// 2. Match in Performer Alias table
	a, err := q.GetPerformerAliasByName(ctx, normalized)
	if err == nil {
		performer, err := q.GetPerformer(ctx, a.Performer)
		if err != nil {
			return PerformerMatchResult{}, err
		}
		return PerformerMatchResult{Name: rawPerformer, Match: performer.Name, Confidence: 75}, nil
	} else if err != sql.ErrNoRows {
		return PerformerMatchResult{}, err
	}

	// 3. Fuzzy match against Performers
	performers, err := q.ListPerformers(ctx)
	if err != nil {
		return PerformerMatchResult{}, err
	}
	for _, p := range performers {
		if metadata.IsFuzzyMatch(p.Name, normalized) {
			return PerformerMatchResult{Name: rawPerformer, Match: p.Name, Confidence: 50}, nil
		}
	}

	// 4. Fuzzy match against Performer Aliases
	aliases, err := q.ListPerformerAliases(ctx)
	if err != nil {
		return PerformerMatchResult{}, err
	}
	performerMap := make(map[int32]string)
	for _, p := range performers {
		performerMap[p.ID] = p.Name
	}
	for _, a := range aliases {
		if metadata.IsFuzzyMatch(a.Alias, normalized) {
			if name, ok := performerMap[a.Performer]; ok {
				return PerformerMatchResult{Name: rawPerformer, Match: name, Confidence: 25}, nil
			}
		}
	}

	return PerformerMatchResult{Name: rawPerformer, Match: "", Confidence: 0}, nil
}

func MultiPerformerMatch(ctx context.Context, c metadata.ImagesConfig, rawPerformers string) ([]PerformerMatchResult, error) {
	var results []PerformerMatchResult

	match, err := PerformerMatch(ctx, c.Queries, rawPerformers)
	if err != nil {
		return nil, err
	}

	if match.Confidence > 0 { // we found a match on the full rawPerformers - so no need to futher divide
		results = append(results, match)
		return results, nil
	}

	// Check if rawPerformers contains at least one of the patterns used to seperate multiple performers on stage
	cachedPatterns := c.Patterns.Get()
	patterns := make([]string, len(cachedPatterns))
	copy(patterns, cachedPatterns)

	// Sort patterns by length in descending order so we match the longest pattern first
	sort.Slice(patterns, func(i, j int) bool {
		return len(patterns[i]) > len(patterns[j])
	})

	for _, pattern := range patterns {
		parts := splitFuzzy(rawPerformers, pattern)
		if len(parts) > 1 {
			for _, part := range parts {
				part = strings.TrimSpace(part)
				if part == "" {
					continue
				}
				match, err := PerformerMatch(ctx, c.Queries, part)
				if err != nil {
					return nil, err
				}
				if len(results) > 0 {
					match.Pattern = pattern
				}
				results = append(results, match)
			}
			return results, nil
		}
	}

	// If we've reached here we've not found any matches despite splitting the rawPerformers based on patterns that indicate multiple performers on stage
	results = append(results, match)

	return results, nil
}

func splitFuzzy(s, sep string) []string {
	if sep == "" {
		return []string{s}
	}

	threshold := 2
	if len(sep) <= 5 {
		threshold = 1
	}

	sRunes := []rune(s)
	sLower := []rune(strings.ToLower(s))
	sepLowerStr := strings.ToLower(sep)
	sepLen := len([]rune(sepLowerStr))

	var parts []string
	lastIdx := 0
	i := 0
	for i < len(sLower) {
		bestDist := threshold + 1
		bestLen := -1

		minLen := sepLen - threshold
		if minLen < 1 {
			minLen = 1
		}
		maxLen := sepLen + threshold
		if maxLen > len(sLower)-i {
			maxLen = len(sLower) - i
		}

		for l := minLen; l <= maxLen; l++ {
			candidate := string(sLower[i : i+l])
			dist := metadata.Levenshtein(candidate, sepLowerStr)
			if dist <= threshold {
				if dist < bestDist {
					bestDist = dist
					bestLen = l
				}
			}
		}

		if bestLen != -1 {
			parts = append(parts, string(sRunes[lastIdx:i]))
			lastIdx = i + bestLen
			i += bestLen
		} else {
			i++
		}
	}
	parts = append(parts, string(sRunes[lastIdx:]))
	return parts
}
