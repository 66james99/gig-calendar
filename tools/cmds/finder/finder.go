package main

import (
	"flag"
	"fmt"
	"os"
)

func main() {
	// Define flags
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

	// Check for positional argument (source)
	args := flag.Args()
	if len(args) != 1 {
		fmt.Println("Error: source parameter is required")
		flag.Usage()
		os.Exit(1)
	}

	source := args[0]

	// Validate source
	switch source {
	case "images":
		// Valid
	case "tickets", "info":
		if *dateFromExif || *rootDir != "" || *pattern != "" {
			fmt.Println("Error: flags --date_from_exif, --rootdir, and --pattern are only valid when source is 'images'")
			os.Exit(1)
		}
	default:
		fmt.Printf("Error: invalid source '%s'. Must be one of: images, tickets, info\n", source)
		os.Exit(1)
	}

	fmt.Printf("Source: %s\nDryrun: %v\n", source, *dryRun)
	if source == "images" {
		fmt.Printf("DateFromExif: %v\nRootDir: %s\nPattern: %s\n", *dateFromExif, *rootDir, *pattern)
	}
}
