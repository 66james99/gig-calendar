package performers

import (
	"context"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/66james99/gig-calendar/internal/metadata"
)

// PerformerMatchResult holds the result of a performer matching operation.
type PerformerMatchResult struct {
	Name       string
	Match      string
	Confidence int
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
	performers, err := q.ListPerformers(ctx)
	if err != nil {
		return PerformerMatchResult{}, err
	}

	for _, p := range performers {
		if p.Name == normalized {
			return PerformerMatchResult{Name: p.Name, Match: p.Name, Confidence: 100}, nil
		}
	}

	// 2. Match in Performer Alias table
	aliases, err := q.ListPerformerAliases(ctx)
	if err != nil {
		return PerformerMatchResult{}, err
	}

	performerMap := make(map[int32]string)
	for _, p := range performers {
		performerMap[p.ID] = p.Name
	}

	for _, a := range aliases {
		if a.Alias == normalized {
			if name, ok := performerMap[a.Performer]; ok {
				return PerformerMatchResult{Name: name, Match: a.Alias, Confidence: 75}, nil
			}
		}
	}

	// 3. Fuzzy match against Performers
	for _, p := range performers {
		if metadata.IsFuzzyMatch(p.Name, normalized) {
			return PerformerMatchResult{Name: p.Name, Match: p.Name, Confidence: 50}, nil
		}
	}

	// 4. Fuzzy match against Performer Aliases
	for _, a := range aliases {
		if metadata.IsFuzzyMatch(a.Alias, normalized) {
			if name, ok := performerMap[a.Performer]; ok {
				return PerformerMatchResult{Name: name, Match: a.Alias, Confidence: 25}, nil
			}
		}
	}

	return PerformerMatchResult{Confidence: 0}, nil
}
