package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
)

func parseFlags() (*bool, *bool, *string, *string) {
	dryRun := flag.Bool("dryrun", false, "Indicates no changes should be made, only report what would have been changed")
	dateFromExif := flag.Bool("date_from_exif", false, "Indicates if date should be extracted from EXIF (images only)")
	rootDir := flag.String("rootdir", "", "Path to the root directory (images only)")
	pattern := flag.String("pattern", "", "Pattern to match files (images only)")

	// Custom usage message
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "Usage: %s [flags] <source>\n", os.Args[0])
		fmt.Println("\nParameters:")
		fmt.Println("  source: source of data to be used (images, tickets, info)")
		fmt.Println("\nFlags:")
		flag.PrintDefaults()
	}

	flag.Parse()
	return dryRun, dateFromExif, rootDir, pattern
}

func parseOptions() string {
	args := flag.Args()
	if len(args) != 1 {
		fmt.Println("Error: source parameter is required")
		flag.Usage()
		os.Exit(1)
	}
	return args[0]
}

func validateFlags(source string) {
	validFlagsBySource := map[string][]string{
		"images":  {"dryrun", "date_from_exif", "rootdir", "pattern"},
		"tickets": {"dryrun"},
		"info":    {"dryrun"},
	}

	allowedFlags, sourceIsValid := validFlagsBySource[source]
	if !sourceIsValid {
		knownSources := make([]string, 0, len(validFlagsBySource))
		for k := range validFlagsBySource {
			knownSources = append(knownSources, k)
		}
		fmt.Printf("Error: invalid source '%s'. Must be one of: %s\n", source, strings.Join(knownSources, ", "))
		os.Exit(1)
	}

	allowedSet := make(map[string]struct{}, len(allowedFlags))
	for _, f := range allowedFlags {
		allowedSet[f] = struct{}{}
	}

	flag.Visit(func(f *flag.Flag) {
		if _, allowed := allowedSet[f.Name]; !allowed {
			fmt.Printf("Error: flag --%s is not valid for source '%s'\n", f.Name, source)
			os.Exit(1)
		}
	})
}

func main() {
	dryRun, dateFromExif, rootDir, pattern := parseFlags()
	source := parseOptions()
	validateFlags(source)

	fmt.Printf("Source: %s\nDryrun: %v\n", source, *dryRun)
	if source == "images" {
		fmt.Printf("DateFromExif: %v\nRootDir: %s\nPattern: %s\n", *dateFromExif, *rootDir, *pattern)
	}
}
