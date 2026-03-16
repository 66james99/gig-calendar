package venue

import (
	"context"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/66james99/gig-calendar/internal/metadata"
)

// MatchResult holds the result of a venue matching operation.
type VenueMatchResult struct {
	Name       string
	Match      string
	Confidence int
}

// Match checks for the existence of a venue in the database.
// It returns a confidence score:
// 100: Exact match in venue table
// 75:  Match in venue_alias table
// 50:  Fuzzy match against venue table
// 25:  Fuzzy match against venue_alias table
// 0:   No match
func VenueMatch(ctx context.Context, q *database.Queries, rawVenue string) (VenueMatchResult, error) {
	normalized := metadata.Normalize(rawVenue)
	if normalized == "" {
		return VenueMatchResult{Confidence: 0}, nil
	}

	// 1. Exact match in Venue table
	venues, err := q.ListVenues(ctx)
	if err != nil {
		return VenueMatchResult{}, err
	}

	for _, v := range venues {
		if v.Name == normalized {
			return VenueMatchResult{Name: v.Name, Match: v.Name, Confidence: 100}, nil
		}
	}

	// 2. Match in Venue Alias table
	aliases, err := q.ListVenueAliases(ctx)
	if err != nil {
		return VenueMatchResult{}, err
	}

	venueMap := make(map[int32]string)
	for _, v := range venues {
		venueMap[v.ID] = v.Name
	}

	for _, a := range aliases {
		if a.Alias == normalized {
			if name, ok := venueMap[a.Venue]; ok {
				return VenueMatchResult{Name: name, Match: a.Alias, Confidence: 75}, nil
			}
		}
	}

	// 3. Fuzzy match
	// We check against Venues using Levenshtein distance
	for _, v := range venues {
		if metadata.IsFuzzyMatch(v.Name, normalized) {
			return VenueMatchResult{Name: v.Name, Match: v.Name, Confidence: 50}, nil
		}
	}

	// 4. Fuzzy match against Venue Aliases
	for _, a := range aliases {
		if metadata.IsFuzzyMatch(a.Alias, normalized) {
			if name, ok := venueMap[a.Venue]; ok {
				return VenueMatchResult{Name: name, Match: a.Alias, Confidence: 25}, nil
			}
		}
	}

	return VenueMatchResult{Confidence: 0}, nil
}
