package main

import (
	"flag"
	"fmt"
	"os"
)

type BaseConfig struct {
	Source string
	DryRun bool
}

type ImagesConfig struct {
	BaseConfig
	DateFromExif bool
	RootDir      string
	Pattern      string
}

type TicketsConfig struct {
	BaseConfig
}

type InfoConfig struct {
	BaseConfig
}

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
	dateFromExif := fs.Bool("date_from_exif", false, "Indicates if date should be extracted from EXIF (images only)")
	rootDir := fs.String("rootdir", "", "Path to the root of directories to be scanned for event meta information (images only)")
	pattern := fs.String("pattern", "", "Pattern to extract performer, promoter and venue from directory path (images only)")

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

	base := BaseConfig{
		Source: source,
		DryRun: *dryRun,
	}

	switch source {
	case "images":
		return ImagesConfig{
			BaseConfig:   base,
			DateFromExif: *dateFromExif,
			RootDir:      *rootDir,
			Pattern:      *pattern,
		}, nil
	case "tickets":
		return TicketsConfig{BaseConfig: base}, nil
	case "info":
		return InfoConfig{BaseConfig: base}, nil
	default:
		return nil, fmt.Errorf("Error: invalid source '%s'", source)
	}
}

func validateFlags(source string, fs *flag.FlagSet) error {
	validFlagsBySource := map[string][]string{
		"images":  {"dryrun", "date_from_exif", "rootdir", "pattern"},
		"tickets": {"dryrun"},
		"info":    {"dryrun"},
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
	case ImagesConfig:
		fmt.Printf("Source: %s\nDryrun: %v\n", cfg.Source, cfg.DryRun)
		fmt.Printf("DateFromExif: %v\nRootDir: %s\nPattern: %s\n", cfg.DateFromExif, cfg.RootDir, cfg.Pattern)
	case TicketsConfig:
		fmt.Printf("Source: %s\nDryrun: %v\n", cfg.Source, cfg.DryRun)
	case InfoConfig:
		fmt.Printf("Source: %s\nDryrun: %v\n", cfg.Source, cfg.DryRun)
	}
}
