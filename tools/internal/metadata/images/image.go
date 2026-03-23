package images

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/66james99/gig-calendar/internal/metadata"
	"github.com/66james99/gig-calendar/internal/metadata/performers"
	"github.com/66james99/gig-calendar/internal/metadata/promoters"
	"github.com/66james99/gig-calendar/internal/metadata/venues"
	"github.com/66james99/gig-calendar/internal/dbcollection"
)

type ImagesConfig struct {
	metadata.BaseConfig
	DateFromExif  bool
	RootDir       string
	Pattern       string	// The pattern of tokens to be matching in the directory path
	IncludeParent bool
	IgnoreDirs    []string
	Queries       *database.Queries
	Patterns      *dbcollection.DBArray[string]		// An array of patterns to be used to seperate performers when there are more than one in a single slot
}

type Performer struct {
	Name       string `json:"name"`
	Match      string `json:"match"`
	Confidence int    `json:"confidence"`
}

type Promoter struct {
	Name       string `json:"name"`
	Match      string `json:"match"`
	Confidence int    `json:"confidence"`
}

// ParsedResult holds the parsed data for a single directory.
type ParsedResult struct {
	Directory       string   `json:"directory"`
	Year            int      `json:"year,omitempty"`
	Month           int      `json:"month,omitempty"`
	Day             int      `json:"day,omitempty"`
	Performers      []string `json:"performers,omitempty"`
	Venue           string   `json:"venue,omitempty"`
	VenueMatch      string   `json:"venue_match,omitempty"`
	VenueConfidence int      `json:"venue_confidence,omitempty"`
	Promoters       []string `json:"promoters,omitempty"`
	Consistent      bool     `json:"consistent"`
}

// ScanResult holds the outcome of a directory scan operation.
type ScanResult struct {
	Directories       []string        `json:"directories"`
	Successes         []MatchedResult `json:"successes,omitempty"`
	SuccessCount      int             `json:"success_count"`
	InconsistentCount int             `json:"inconsistent_count"`
	ErrorCount        int             `json:"error_count"`
	IgnoredCount      int             `json:"ignored_count"`
	ParseErrors       []string        `json:"parse_errors,omitempty"` // Only populated in debug mode
}

// MatchedResult holds the outcome of matching Performers, Venue and Promoter against those existing in the DB
type MatchedResult struct {
	Directory  string                            	`json:"directory"`
	Year       int                               	`json:"year,omitempty"`
	Month      int                               	`json:"month,omitempty"`
	Day        int                               	`json:"day,omitempty"`
	Performers [][]performers.PerformerMatchResult 	`json:"performers,omitempty"`
	Venue      venues.VenueMatchResult           	`json:"venue,omitempty"`
	Promoters  []promoters.PromoterMatchResult   	`json:"promoters,omitempty"`
	Consistent bool                              	`json:"consistent"`
}

// ExecuteScan performs the directory scanning and parsing based on the provided config.
// It returns a structured result and does not print to standard output.
func ExecuteScan(cfg ImagesConfig) (ScanResult, error) {
	var result ScanResult

	if cfg.Pattern == "" {
		return result, fmt.Errorf("empty pattern not allowed")
	}

	depth := 0
	if cfg.Pattern != "" {
		depth = strings.Count(cfg.Pattern, "/") + 1
	}
	if cfg.IncludeParent {
		depth--
	}

	dirs, ignoredCount, err := GetDirsAtDepth(cfg, depth)
	if err != nil {
		return result, fmt.Errorf("error scanning directories: %w", err)
	}
	result.Directories = dirs
	result.IgnoredCount = ignoredCount

	for _, dir := range dirs {
		if cfg.Pattern != "" {
			data, err := ParseLocation(cfg.Pattern, dir)
			if err != nil {
				result.ErrorCount++
				if cfg.Debug {
					result.ParseErrors = append(result.ParseErrors, fmt.Sprintf("Error parsing location %s: %v", dir, err))
				}
			} else {
				result.SuccessCount++
				if !data.Consistent {
					result.InconsistentCount++
				}
				matched := MatchedResult{
					Directory: dir,
					Year:      data.Year,
					Month:     data.Month,
					Day:       data.Day,
					// Performers: data.Performers,
					// Promoters:  data.Promoters,
					Consistent: data.Consistent,
				}

				if cfg.Queries != nil {
					if data.Venue != "" {
						match, err := venues.VenueMatch(context.Background(), cfg.Queries, data.Venue)
						if err == nil {
							matched.Venue = match
						} else if cfg.Debug {
							result.ParseErrors = append(result.ParseErrors, fmt.Sprintf("Error matching venue '%s': %v", data.Venue, err))
						}
					}
					if len(data.Performers) > 0 {
						for _, p := range data.Performers {
							match, err := performers.MultiPerformerMatch(context.Background(), cfg, p)
							if err == nil {
								matched.Performers = append(matched.Performers, match)
							} else if cfg.Debug {
								result.ParseErrors = append(result.ParseErrors, fmt.Sprintf("Error matching performer '%s': %v", p, err))
							}
						}
					}
					if len(data.Promoters) > 0 {
						for _, p := range data.Promoters {
							match, err := promoters.PromoterMatch(context.Background(), cfg.Queries, p)
							if err == nil {
								matched.Promoters = append(matched.Promoters, match)
							} else if cfg.Debug {
								result.ParseErrors = append(result.ParseErrors, fmt.Sprintf("Error matching promoter '%s': %v", p, err))
							}
						}
					}

					festivalCount := 0
					var festival promoters.PromoterMatchResult
					for _, p := range matched.Promoters {
						if p.Festival {
							festivalCount++
							festival = p
						}
					}

					if festivalCount > 1 {
						matched.Consistent = false
					} else if festivalCount == 1 {
						// If there is exactly one festival, check if the event date is within the festival's date range.
						foundFestival, err := cfg.Queries.GetFestivalByName(context.Background(), festival.Match)
						if err == nil {
							if matched.Year > 0 && matched.Month > 0 && matched.Day > 0 {
								eventDate := time.Date(matched.Year, time.Month(matched.Month), matched.Day, 0, 0, 0, 0, time.UTC)
								if eventDate.Before(foundFestival.StartDate) || eventDate.After(foundFestival.EndDate) {
									// If it is already inconsistent then don't need to flag and increment counter. Avoid double counting,
									if matched.Consistent {
									matched.Consistent = false
									result.InconsistentCount++
									}
								}
								
							}
						}

					}

				}
				result.Successes = append(result.Successes, matched)
			}
		}
	}

	return result, nil
}

func PrintCfg(cfg ImagesConfig) {
	fmt.Printf("Source: %s\nDryrun: %v\nVerbose: %v\nDebug: %v\n", cfg.Source, cfg.DryRun, cfg.Verbose, cfg.Debug)
	fmt.Printf("DateFromExif: %v\nRootDir: %s\nPattern: %s\nInclude Parent: %v\nIgnoreDirs: %v\n", cfg.DateFromExif, cfg.RootDir, cfg.Pattern, cfg.IncludeParent, cfg.IgnoreDirs)

	result, err := ExecuteScan(cfg)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	if cfg.Verbose || cfg.Debug {
		fmt.Printf("Ignored %d directories matching ignore list\n", result.IgnoredCount)
	}

	fmt.Printf("\n--- Parsing Summary ---\n")
	fmt.Printf("Successfully parsed: %d\n", result.SuccessCount)
	fmt.Printf("Inconsistent data:   %d\n", result.InconsistentCount)
	fmt.Printf("Failed to parse:     %d\n", result.ErrorCount)
}

// GetDirsAtDepth walks the directory tree from cfg.RootDir and returns a list of
// directory paths at a specific depth `n`. It also returns the count of ignored directories.
func GetDirsAtDepth(cfg ImagesConfig, n int) ([]string, int, error) {
	var dirs []string
	ignoredCount := 0

	err := filepath.WalkDir(cfg.RootDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() {
			return nil
		}

		for _, ignore := range cfg.IgnoreDirs {
			if strings.Contains(path, ignore) {
				if d.IsDir() {
					ignoredCount++
					return filepath.SkipDir
				}
				return nil
			}
		}

		rel, err := filepath.Rel(cfg.RootDir, path)
		if err != nil {
			return err
		}

		if rel == "." {
			return nil
		}

		depth := len(strings.Split(rel, string(os.PathSeparator)))
		if depth == n {
			if cfg.IncludeParent {
				dirs = append(dirs, filepath.Join(filepath.Base(cfg.RootDir), rel))
			} else {
				dirs = append(dirs, rel)
			}
			return filepath.SkipDir
		}
		return nil
	})

	return dirs, ignoredCount, err
}
