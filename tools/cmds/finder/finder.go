package main

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/66james99/gig-calendar/internal/metadata"
	"github.com/66james99/gig-calendar/internal/metadata/images"
)

func parseArgs() (string, []string, error) {
	if len(os.Args) < 2 {
		return "", nil, fmt.Errorf("Error: source parameter is required")
	}
	source := os.Args[1]
	switch source {
	case "images", "tickets", "info":
		return source, os.Args[2:], nil
	default:
		return "", nil, fmt.Errorf("Error: invalid source '%s'. Must be one of: images, tickets, info", source)
	}
}

func parseFlags(source string, args []string) (interface{}, error) {
	fs := flag.NewFlagSet(source, flag.ContinueOnError)
	dryRun := fs.Bool("dryrun", false, "Indicates no changes should be made, only report what would have been changed")
	verbose := fs.Bool("verbose", false, "Indicates if verbose output should be displayed")
	debug := fs.Bool("debug", false, "Indicates if debug output should be displayed")
	dateFromExif := fs.Bool("date_from_exif", false, "Indicates if date should be extracted from EXIF (images only)")
	rootDir := fs.String("rootdir", "", "Path to the root of directories to be scanned for event meta information (images only)")
	pattern := fs.String("pattern", "", "Pattern to extract performer, promoter and venue from directory path (images only)")
	incParent := fs.Bool("include_parent", false, "Include the last directory in the root directory in the path use of metadata (images only)")
	ignoreDirs := fs.String("ignore_dirs", "", "Comma separated list of strings to ignore in paths (images only)")

	// Custom usage message
	fs.Usage = func() {
		fmt.Fprintf(fs.Output(), "Usage: %s <source> [flags]\n", os.Args[0])
		fmt.Fprintln(fs.Output(), "\nParameters:")
		fmt.Fprintln(fs.Output(), "  source: source of data to be used (images, tickets, info)")
		fmt.Fprintln(fs.Output(), "\nFlags:")
		fs.PrintDefaults()
	}

	if err := fs.Parse(args); err != nil {
		return nil, err
	}

	if err := validateFlags(source, fs); err != nil {
		return nil, err
	}

	base := metadata.BaseConfig{
		Source:  source,
		DryRun:  *dryRun,
		Verbose: *verbose,
		Debug:   *debug,
	}

	switch source {
	case "images":
		if err := images.ValidatePattern(*pattern); err != nil {
			return nil, fmt.Errorf("invalid --pattern value: %w", err)
		}
		var ignoreList []string
		if *ignoreDirs != "" {
			ignoreList = strings.Split(*ignoreDirs, ",")
		}

		return images.ImagesConfig{
			BaseConfig:    base,
			DateFromExif:  *dateFromExif,
			RootDir:       *rootDir,
			Pattern:       *pattern,
			IncludeParent: *incParent,
			IgnoreDirs:    ignoreList,
		}, nil
	case "tickets":
		return metadata.TicketsConfig{BaseConfig: base}, nil
	case "info":
		return metadata.InfoConfig{BaseConfig: base}, nil
	default:
		return nil, fmt.Errorf("Error: invalid source '%s'", source)
	}
}

func validateFlags(source string, fs *flag.FlagSet) error {
	validFlagsBySource := map[string][]string{
		"images":  {"dryrun", "verbose", "debug", "date_from_exif", "rootdir", "pattern", "include_parent", "ignore_dirs"},
		"tickets": {"dryrun", "verbose", "debug"},
		"info":    {"dryrun", "verbose", "debug"},
	}

	// Source is already validated in parseArgs
	allowedFlags := validFlagsBySource[source]

	allowedSet := make(map[string]struct{}, len(allowedFlags))
	for _, f := range allowedFlags {
		allowedSet[f] = struct{}{}
	}

	var err error
	fs.Visit(func(f *flag.Flag) {
		if _, allowed := allowedSet[f.Name]; !allowed {
			err = fmt.Errorf("Error: flag --%s is not valid for source '%s'", f.Name, source)
		}
	})
	return err
}

func main() {
	source, args, err := parseArgs()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	config, err := parseFlags(source, args)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}

	switch cfg := config.(type) {
	case images.ImagesConfig:
		images.PrintCfg(cfg)
	case metadata.TicketsConfig:
		fmt.Printf("Source: %s\nDryrun: %v\nVerbose: %v\nDebug: %v\n", cfg.Source, cfg.DryRun, cfg.Verbose, cfg.Debug)
	case metadata.InfoConfig:
		fmt.Printf("Source: %s\nDryrun: %v\nVerbose: %v\nDebug: %v\n", cfg.Source, cfg.DryRun, cfg.Verbose, cfg.Debug)
	}
}
