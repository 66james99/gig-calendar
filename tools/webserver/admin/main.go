package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/66james99/gig-calendar/internal/apiHandler"
	"github.com/66james99/gig-calendar/internal/database"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	_ "github.com/lib/pq" // init postgres driver
)

func main() {
	devMode := flag.Bool("dev", false, "Run the server in development mode")
	flag.Parse()

	// Load environment variables from a .env file if it exists.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	// Establish database connection.
	db, err := database.Connect(database.ConnectParams{
		IsDev:    *devMode,
		UserType: database.AppUser,
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create the api handler with our database queries.
	queries := database.New(db)
	handler := apiHandler.New(queries)

	// Create a new Echo instance.
	e := echo.New()

	// --- Middleware ---
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogValuesFunc: func(c *echo.Context, v middleware.RequestLoggerValues) error {
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

	const apiVersion = "v1"
	const apiPrefix = "/api/" + apiVersion

	apiGroup := e.Group(apiPrefix)

	// --- Routes ---
	apiGroup.POST("/image_locations", handler.CreateImageLocation)
	apiGroup.GET("/image_locations", handler.ListImageLocations)
	apiGroup.GET("/image_locations/:id", handler.GetImageLocation)
	apiGroup.PUT("/image_locations/:id", handler.UpdateImageLocation)
	apiGroup.DELETE("/image_locations/:id", handler.DeleteImageLocation)
	apiGroup.GET("/image_locations/:id/preview_scan", handler.PreviewImageLocationScan)

	// --- Venue Routes ---
	apiGroup.POST("/venues", handler.CreateVenue)
	apiGroup.GET("/venues", handler.ListVenues)
	apiGroup.GET("/venues/:id", handler.GetVenue)
	apiGroup.PUT("/venues/:id", handler.UpdateVenue)
	apiGroup.DELETE("/venues/:id", handler.DeleteVenue)

	// --- Venue Alias Routes ---
	apiGroup.POST("/venue_aliases", handler.CreateVenueAlias)
	apiGroup.GET("/venue_aliases", handler.ListVenueAliases)
	apiGroup.GET("/venue_aliases/:id", handler.GetVenueAlias)
	apiGroup.PUT("/venue_aliases/:id", handler.UpdateVenueAlias)
	apiGroup.DELETE("/venue_aliases/:id", handler.DeleteVenueAlias)

	// Serve static frontend files.
	e.Static("/", "../docs/content/admin.gig-calendar.com")
	

	// Start the server.
	log.Println("Starting server on :8080")
	if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
