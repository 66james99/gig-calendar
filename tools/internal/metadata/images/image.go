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
}

func PrintCfg(cfg ImagesConfig) {

	fmt.Printf("Source: %s\nDryrun: %v\n", cfg.Source, cfg.DryRun)
	fmt.Printf("DateFromExif: %v\nRootDir: %s\nPattern: %s\nInclude Parent: %v\n", cfg.DateFromExif, cfg.RootDir, cfg.Pattern, cfg.IncludeParent)

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
		fmt.Printf("Directories at depth %d:\n", depth)
		for _, dir := range dirs {
			fmt.Println(dir)
			if cfg.Pattern != "" {
				data, err := ParseLocation(cfg.Pattern, dir)
				if err != nil {
					fmt.Printf("  Error parsing location: %v\n", err)
				} else {
					fmt.Printf("  Parsed Data: %+v\n", data)
				}
			}
		}
	}
}

func GetDirsAtDepth(cfg ImagesConfig, n int) ([]string, error) {
	var dirs []string

	err := filepath.WalkDir(cfg.RootDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			return nil
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

	return dirs, err
}
