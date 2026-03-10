package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
)

// DBUserType defines the type of database user.
type DBUserType string

const (
	// AppUser is for the application's day-to-day operations.
	AppUser DBUserType = "app"
	// AdminUser is for administrative tasks like migrations.
	AdminUser DBUserType = "admin"
)

// ConnectParams holds parameters for connecting to the database.
type ConnectParams struct {
	IsDev    bool
	UserType DBUserType
}

// Connect establishes a database connection based on environment variables and provided parameters.
func Connect(params ConnectParams) (*sql.DB, error) {
	credentialsPath := os.Getenv("DB_GSM_CREDENTIALS_PATH")
	if credentialsPath == "" {
		return nil, fmt.Errorf("DB_GSM_CREDENTIALS_PATH not set in environment")
	}

	host := os.Getenv("DB_HOST")
	var user, passwordSecretID, dbname, userEnvVar, passwordEnvVar string

	switch params.UserType {
	case AppUser:
		userEnvVar = "DB_APP_USER"
		passwordEnvVar = "DB_APP_PASSWORD_SECRET_ID"
		user = os.Getenv(userEnvVar)
		passwordSecretID = os.Getenv(passwordEnvVar)
	case AdminUser:
		userEnvVar = "DB_ADMIN_USER"
		passwordEnvVar = "DB_ADMIN_PASSWORD_SECRET_ID"
		user = os.Getenv(userEnvVar)
		passwordSecretID = os.Getenv(passwordEnvVar)
	default:
		return nil, fmt.Errorf("invalid user type specified: %s", params.UserType)
	}

	if params.IsDev {
		log.Println("Running in development mode")
		dbname = os.Getenv("DB_NAME_DEV")
	} else {
		log.Println("Running in production mode")
		dbname = os.Getenv("DB_NAME")
	}
	sslmode := os.Getenv("DB_SSLMODE")
	if sslmode == "" {
		sslmode = "disable" // Default sslmode
	}

	// Validate required environment variables
	var missing []string
	if host == "" {
		missing = append(missing, "DB_HOST")
	}
	if user == "" {
		missing = append(missing, userEnvVar)
	}
	if passwordSecretID == "" {
		missing = append(missing, passwordEnvVar)
	}
	if dbname == "" {
		if params.IsDev {
			missing = append(missing, "DB_NAME_DEV")
		} else {
			missing = append(missing, "DB_NAME")
		}
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required DB environment variables: %s", strings.Join(missing, ", "))
	}

	log.Println("Fetching database password from Secret Manager...")
	password, err := GetSecret(passwordSecretID, credentialsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get secret from Secret Manager: %w", err)
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=%s", host, user, password, dbname, sslmode)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection successful.")
	return db, nil
}
