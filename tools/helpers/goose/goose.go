package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/pressly/goose/v3"
	"google.golang.org/api/option"
)

// getSecret fetches a secret from Google Cloud Secret Manager.
// The name should be in the format `projects/*/secrets/*/versions/*`.
func getSecret(name string, credentialsPath string) (string, error) {
	ctx := context.Background()

	jsonCredentials, err := os.ReadFile(credentialsPath)
	if err != nil {
		return "", fmt.Errorf("failed to read credentials file: %w", err)
	}

	client, err := secretmanager.NewClient(ctx, option.WithAuthCredentialsJSON(option.ServiceAccount, jsonCredentials))
	if err != nil {
		return "", fmt.Errorf("failed to create secretmanager client: %w", err)
	}
	defer client.Close()

	req := &secretmanagerpb.AccessSecretVersionRequest{
		Name: name,
	}

	result, err := client.AccessSecretVersion(ctx, req)
	if err != nil {
		return "", fmt.Errorf("failed to access secret version: %w", err)
	}

	return string(result.Payload.Data), nil
}

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
	// 2. Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	credentialsPath := os.Getenv("DB_GSM_CREDENTIALS_PATH")
	if credentialsPath == "" {
		log.Fatal("DB_GSM_CREDENTIALS_PATH not set in environment")
	}

	// 3. Get configuration from environment
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	var dbname string
	switch environment {
	case "dev":
		dbname = os.Getenv("DB_NAME_DEV")
	case "prod":
		dbname = os.Getenv("DB_NAME")
	default:
		log.Fatalf("Invalid environment '%s'. Must be 'dev' or 'prod'.", environment)
	}
	sslmode := os.Getenv("DB_SSLMODE")
	migrationsDir := os.Getenv("DB_MIGRATIONS_DIR")
	passwordSecretID := os.Getenv("DB_PASSWORD_SECRET_ID")

	// 4. Validate required environment variables
	if host == "" || user == "" || passwordSecretID == "" {
		log.Fatal("Missing required environment variables. Please set DB_HOST, DB_USER, and DB_PASSWORD_SECRET_ID.")
	}
	if dbname == "" {
		if environment == "dev" {
			log.Fatal("DB_NAME_DEV not set for 'dev' environment.")
		} else {
			log.Fatal("DB_NAME not set for 'prod' environment.")
		}
	}
	if sslmode == "" {
		sslmode = "disable"
	}
	if migrationsDir == "" {
		migrationsDir = "migrations"
	}

	if err := validateMigrationsDir(migrationsDir); err != nil {
		log.Fatal(err)
	}

	// 5. Fetch database password from Google Secret Manager
	log.Println("Fetching database password from Secret Manager...")
	password, err := getSecret(passwordSecretID, credentialsPath)
	if err != nil {
		log.Fatalf("Failed to get secret from Secret Manager: %v", err)
	}

	// 6. Construct DSN and connect to the database
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=%s", host, user, password, dbname, sslmode)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database. Check connection details and network access: %v", err)
	}
	log.Println("Database connection successful.")

	// 7. Run the goose migration command
	if *dryRun {
		log.Println("--dryrun enabled. Verifying configuration and connectivity without making changes.")

		// Construct a redacted DSN to avoid printing the password.
		redactedDSN := fmt.Sprintf("host=%s user=%s password=*** dbname=%s sslmode=%s", host, user, dbname, sslmode)
		log.Printf("Command that would be run: goose -dir %s postgres \"%s\" %s", migrationsDir, redactedDSN, command)
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
