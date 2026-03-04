package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/lib/pq"
	_ "github.com/lib/pq" // init postgres driver
)

// api holds the database queries, making them available to handlers.
type api struct {
	queries *database.Queries
}

// imageLocationPayload defines the shape of the JSON body for create and update requests.
type imageLocationPayload struct {
	Root          string   `json:"root"`
	Pattern       string   `json:"pattern"`
	DateFromExif  bool     `json:"date_from_exif"`
	IncludeParent bool     `json:"include_parent"`
	IgnoreDirs    []string `json:"ignore_dirs"`
	Active        bool     `json:"active"`
}

func main() {
	devMode := flag.Bool("dev", false, "Run the server in development mode")
	flag.Parse()

	// Load environment variables from a .env file if it exists.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	// Establish database connection.
	db, err := connectDB(*devMode)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create the api handler with our database queries.
	apiHandler := &api{
		queries: database.New(db),
	}

	// Create a new Echo instance.
	e := echo.New()

	// --- Middleware ---
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			log.Printf("remote_ip=%s, method=%s, uri=%s, status=%d, latency=%s",
				v.RemoteIP, v.Method, v.URI, v.Status, v.Latency)
			return nil
		},
		LogLatency:  true,
		LogMethod:   true,
		LogURI:      true,
		LogStatus:   true,
		LogRemoteIP: true,
	}))
	e.Use(middleware.Recover()) // Recover from panics to prevent crashes.
	// Configure CORS to allow requests from a frontend application.
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"}, // For development. In production, lock this down to your frontend's domain.
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete, http.MethodOptions},
	}))

	// --- Routes ---
	e.POST("/image_locations", apiHandler.createImageLocation)
	e.GET("/image_locations", apiHandler.listImageLocations)
	e.GET("/image_locations/:id", apiHandler.getImageLocation)
	e.PUT("/image_locations/:id", apiHandler.updateImageLocation)
	e.DELETE("/image_locations/:id", apiHandler.deleteImageLocation)

	// Start the server.
	log.Println("Starting server on :8080")
	e.Logger.Fatal(e.Start(":8080"))
}

// connectDB handles the logic of connecting to the database, reusing logic from your goose tool.
func connectDB(isDev bool) (*sql.DB, error) {
	credentialsPath := os.Getenv("DB_GSM_CREDENTIALS_PATH")
	if credentialsPath == "" {
		return nil, fmt.Errorf("DB_GSM_CREDENTIALS_PATH not set in environment")
	}

	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_APP_USER")
	var dbname string
	if isDev {
		log.Println("Running in development mode")
		dbname = os.Getenv("DB_NAME_DEV")
	} else {
		log.Println("Running in production mode")
		dbname = os.Getenv("DB_NAME_PROD")
	}
	sslmode := os.Getenv("DB_SSLMODE")
	passwordSecretID := os.Getenv("DB_APP_PASSWORD_SECRET_ID")

	if host == "" || user == "" || passwordSecretID == "" || dbname == "" {
		var missing []string
		if host == "" {
			missing = append(missing, "DB_HOST")
		}
		if user == "" {
			missing = append(missing, "DB_APP_USER")
		}
		if passwordSecretID == "" {
			missing = append(missing, "DB_APP_PASSWORD_SECRET_ID")
		}
		if dbname == "" {
			if isDev {
				missing = append(missing, "DB_NAME_DEV")
			} else {
				missing = append(missing, "DB_NAME_PROD")
			}
		}
		return nil, fmt.Errorf("missing required DB environment variables: %s", strings.Join(missing, ", "))
	}

	log.Println("Fetching database password from Secret Manager...")
	password, err := database.GetSecret(passwordSecretID, credentialsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get secret from Secret Manager: %w", err)
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=%s", host, user, password, dbname, sslmode)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection successful.")
	return db, nil
}

// --- API Handlers ---

func (a *api) createImageLocation(c echo.Context) error {
	var payload imageLocationPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.CreateImageLocationParams{
		Root:          payload.Root,
		Pattern:       payload.Pattern,
		DateFromExif:  payload.DateFromExif,
		IncludeParent: payload.IncludeParent,
		IgnoreDirs:    pq.StringArray(payload.IgnoreDirs),
		Active:        payload.Active,
	}

	newLocation, err := a.queries.CreateImageLocation(c.Request().Context(), params)
	if err != nil {
		log.Printf("Error creating image location: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create image location"})
	}

	return c.JSON(http.StatusCreated, newLocation)
}

func (a *api) listImageLocations(c echo.Context) error {
	locations, err := a.queries.ListImageLocations(c.Request().Context())
	if err != nil {
		log.Printf("Error listing image locations: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve image locations"})
	}
	return c.JSON(http.StatusOK, locations)
}

func (a *api) getImageLocation(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	location, err := a.queries.GetImageLocation(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Image location not found"})
		}
		log.Printf("Error getting image location: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve image location"})
	}

	return c.JSON(http.StatusOK, location)
}

func (a *api) updateImageLocation(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload imageLocationPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdateImageLocationParams{
		ID:            int32(id),
		Root:          payload.Root,
		Pattern:       payload.Pattern,
		DateFromExif:  payload.DateFromExif,
		IncludeParent: payload.IncludeParent,
		IgnoreDirs:    pq.StringArray(payload.IgnoreDirs),
		Active:        payload.Active,
	}

	updatedLocation, err := a.queries.UpdateImageLocation(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Image location not found"})
		}
		log.Printf("Error updating image location: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update image location"})
	}

	return c.JSON(http.StatusOK, updatedLocation)
}

func (a *api) deleteImageLocation(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeleteImageLocation(c.Request().Context(), int32(id))
	if err != nil {
		log.Printf("Error deleting image location: %v", err)
		// We check if the error is sql.ErrNoRows, but Delete returns no rows, so we can't be sure if it was not found or another error.
		// A robust way is to check existence first, but for simplicity, we'll assume other errors are server errors.
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete image location"})
	}

	return c.NoContent(http.StatusNoContent)
}
