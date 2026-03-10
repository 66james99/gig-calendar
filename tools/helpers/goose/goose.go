package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
)

func validateMigrationsDir(dir string) error {
	info, err := os.Stat(dir)
	if err != nil {
		return fmt.Errorf("migrations directory '%s' not found: %w", dir, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("'%s' is not a directory", dir)
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			return nil
		}
	}

	return fmt.Errorf("migrations directory '%s' contains no .sql files", dir)
}

func main() {
	// 1. Parse command-line arguments, allowing flags to appear after positional args.
	fs := flag.NewFlagSet(os.Args[0], flag.ExitOnError)
	dryRun := fs.Bool("dryrun", false, "Indicates no changes should be made, only report what would have been run")
	fs.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: %s <up|down|status> <dev|prod> [options]\n", os.Args[0])
		fs.PrintDefaults()
	}

	var positionalArgs []string
	var flagArgs []string
	for _, arg := range os.Args[1:] {
		if strings.HasPrefix(arg, "-") {
			flagArgs = append(flagArgs, arg)
		} else {
			positionalArgs = append(positionalArgs, arg)
		}
	}
	fs.Parse(flagArgs) // Parse just the flags. ExitOnError will handle errors.

	if len(positionalArgs) != 2 {
		fs.Usage()
		os.Exit(1)
	}
	command := positionalArgs[0]
	environment := positionalArgs[1]

	// Validate command early to fail fast on invalid input.
	switch command {
	case "up", "down", "status":
		// valid command
	default:
		log.Fatalf("Invalid command '%s'. Must be 'up', 'down', or 'status'.", command)
	}
	// 2. Load environment variables from .env file
	// Try loading from current directory first.
	if err := godotenv.Load(); err == nil {
		log.Println("Loaded .env file from current directory.")
	} else {
		log.Println("No .env file found in current directory, Relying on system environment variables.")
	}

	if environment != "dev" && environment != "prod" {
		log.Fatalf("Invalid environment '%s'. Must be 'dev' or 'prod'.", environment)
	}

	migrationsDir := os.Getenv("DB_MIGRATIONS_DIR")
	if migrationsDir == "" {
		migrationsDir = "migrations"
	}

	if err := validateMigrationsDir(migrationsDir); err != nil {
		log.Fatal(err)
	}

	db, err := database.Connect(database.ConnectParams{IsDev: environment == "dev", UserType: database.AdminUser})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// 7. Run the goose migration command
	if *dryRun {
		log.Println("--dryrun enabled. Verifying configuration and connectivity without making changes.")

		// Construct a redacted DSN to avoid printing the password.
		log.Printf("Command that would be run: goose -dir %s postgres \"<DSN from env>\" %s", migrationsDir, command)
		log.Println("--- Verifying with current migration status ---")

		// Running goose.Status validates DB connectivity, credentials, and migrations table access.
		if err := goose.Status(db, migrationsDir); err != nil {
			log.Fatalf("Dry run failed during status check: %v", err)
		}

		log.Println("---------------------------------------------")
		log.Printf("Dry run successful. The '%s' command was not executed.", command)
		return
	}

	var gooseErr error
	switch command {
	case "up":
		log.Printf("Running migrations 'up' from directory: %s", migrationsDir)
		gooseErr = goose.Up(db, migrationsDir)
	case "down":
		log.Printf("Running migrations 'down' from directory: %s", migrationsDir)
		gooseErr = goose.Down(db, migrationsDir)
	case "status":
		log.Printf("Checking migration status from directory: %s", migrationsDir)
		gooseErr = goose.Status(db, migrationsDir)
	default:
		log.Fatalf("Invalid command '%s'. Must be 'up', 'down', or 'status'.", command)
	}

	if gooseErr != nil {
		log.Fatalf("Goose command '%s' failed: %v", command, gooseErr)
	}

	log.Printf("Goose command '%s' completed successfully!", command)
}
