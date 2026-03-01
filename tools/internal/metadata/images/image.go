package images

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/66james99/gig-calendar/internal/metadata"
)

type ImagesConfig struct {
	metadata.BaseConfig
	DateFromExif  bool
	RootDir       string
	Pattern       string
	IncludeParent bool
	IgnoreDirs    []string
}

func PrintCfg(cfg ImagesConfig) {

	fmt.Printf("Source: %s\nDryrun: %v\nVerbose: %v\nDebug: %v\n", cfg.Source, cfg.DryRun, cfg.Verbose, cfg.Debug)
	fmt.Printf("DateFromExif: %v\nRootDir: %s\nPattern: %s\nInclude Parent: %v\nIgnoreDirs: %v\n", cfg.DateFromExif, cfg.RootDir, cfg.Pattern, cfg.IncludeParent, cfg.IgnoreDirs)

	depth := 0
	if cfg.Pattern != "" {
		depth = strings.Count(cfg.Pattern, "/") + 1
	}
	if cfg.IncludeParent {
		depth--
	}

	dirs, err := GetDirsAtDepth(cfg, depth)
	if err != nil {
		fmt.Printf("Error scanning directories: %v\n", err)
	} else {
		var successCount, errorCount, inconsistentCount int
		fmt.Printf("Directories at depth %d:\n", depth)
		for _, dir := range dirs {
			if cfg.Pattern != "" {
				data, err := ParseLocation(cfg.Pattern, dir)
				if err != nil {
					errorCount++
					if cfg.Debug {
						fmt.Printf("  Error parsing location %s: %v\n", dir, err)
					}
				} else {
					successCount++
					if !data.Consistent {
						inconsistentCount++
					}
					if cfg.Verbose && !cfg.Debug {
						fmt.Printf("  Parsed Data: %+v\n", data)
					}
				}
			}
		}

		fmt.Printf("\n--- Parsing Summary ---\n")
		fmt.Printf("Successfully parsed: %d\n", successCount)
		fmt.Printf("Inconsistent data:   %d\n", inconsistentCount)
		fmt.Printf("Failed to parse:     %d\n", errorCount)

	}
}

func GetDirsAtDepth(cfg ImagesConfig, n int) ([]string, error) {
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

	if cfg.Verbose || cfg.Debug {
		fmt.Printf("Ignored %d directories matching ignore list\n", ignoredCount)
	}

	return dirs, err
}
