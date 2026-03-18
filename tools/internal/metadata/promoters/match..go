package promoters

import (
	"context"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/66james99/gig-calendar/internal/metadata"
	
)

// MatchResult holds the result of a promoter matching operation.
type PromoterMatchResult struct {
	Name       string `json:"name"`
	Match      string `json:"match"`
	Confidence int    `json:"confidence"`
	Promoter   bool   `json:"promoter"`
	Festival   bool   `json:"festival"`
}

// Match checks for the existence of a promoter or festival in the database.
// It returns a confidence score:
// 100: Exact match in promoter table
// 75:  Match in promoter_alias table
// 50:  Fuzzy match against promoter table
// 25:  Fuzzy match against promoter_alias table
// 0:   No match
// Setting Promoter or Festival to true depending on which the match was with
func PromoterMatch(ctx context.Context, q *database.Queries, rawpromoter string) (PromoterMatchResult, error) {
	normalized := metadata.Normalize(rawpromoter)
	if normalized == "" {
		return PromoterMatchResult{Confidence: 0, Promoter: false, Festival: false}, nil
	}

	// 1a. Exact match in promoter table
	promoters, err := q.ListPromoters(ctx)
	if err != nil {
		return PromoterMatchResult{}, err
	}

	for _, v := range promoters {
		if v.Name == normalized {
			return PromoterMatchResult{Name: rawpromoter, Match: v.Name, Confidence: 100, Promoter: true, Festival: false}, nil
		}
	}

	// 1b. Exact match in festival table
	festivals, err := q.ListFestivals(ctx)
	if err != nil {
		return PromoterMatchResult{}, err
	}

	for _, v := range festivals {
		if v.Name == normalized {
			return PromoterMatchResult{Name: rawpromoter, Match: v.Name, Confidence: 100, Promoter: false, Festival: true}, nil
		}
	}

	// 2. Match in promoter Alias table
	aliases, err := q.ListPromoterAliases(ctx)
	if err != nil {
		return PromoterMatchResult{}, err
	}

	promoterMap := make(map[int32]string)
	for _, v := range promoters {
		promoterMap[v.ID] = v.Name
	}

	for _, a := range aliases {
		if a.Alias == normalized {
			if name, ok := promoterMap[a.Promoter]; ok {
				return PromoterMatchResult{Name: rawpromoter, Match: name, Confidence: 75, Promoter: true, Festival: false}, nil
			}
		}
	}
	// 2b. Match in festival Alias table
	festivalAliases, err := q.ListFestivalAliases(ctx)
	if err != nil {
		return PromoterMatchResult{}, err
	}

	festivalMap := make(map[int32]string)
	for _, v := range festivals {
		festivalMap[v.ID] = v.Name
	}

	for _, a := range festivalAliases {
		if a.Alias == normalized {
			if name, ok := festivalMap[a.Festival]; ok {
				return PromoterMatchResult{Name: rawpromoter, Match: name, Confidence: 75, Promoter: false, Festival: true}, nil
			}
		}
	}


	// 3a. Fuzzy match
	// We check against promoters using Levenshtein distance
	for _, v := range promoters {
		if metadata.IsFuzzyMatch(v.Name, normalized) {
			return PromoterMatchResult{Name: rawpromoter, Match: v.Name, Confidence: 50, Promoter: true, Festival: false}, nil
		}
	}

	// 3b. Fuzzy match
	// We check against festivals using Levenshtein distance
	for _, v := range festivals {
		if metadata.IsFuzzyMatch(v.Name, normalized) {
			return PromoterMatchResult{Name: rawpromoter, Match: v.Name, Confidence: 50, Promoter: false, Festival: true}, nil
		}
	}

	// 4. Fuzzy match against promoter Aliases
	for _, a := range aliases {
		if metadata.IsFuzzyMatch(a.Alias, normalized) {
			if name, ok := promoterMap[a.Promoter]; ok {
				return PromoterMatchResult{Name: rawpromoter, Match: name, Confidence: 25, Promoter: true, Festival: false}, nil
			}
		}
	}

	// 4b. Fuzzy match against festival Aliases
	for _, a := range festivalAliases {
		if metadata.IsFuzzyMatch(a.Alias, normalized) {
			if name, ok := festivalMap[a.Festival]; ok {
				return PromoterMatchResult{Name: rawpromoter, Match: name, Confidence: 25, Promoter: false, Festival: true}, nil
			}
		}
	}

	return PromoterMatchResult{Name: rawpromoter, Match: "", Confidence: 0, Promoter: false, Festival: false}, nil
}
