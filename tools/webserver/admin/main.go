package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/66james99/gig-calendar/internal/apiHandler"
	"github.com/66james99/gig-calendar/internal/database"
	"github.com/66james99/gig-calendar/internal/dbcollection"
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

	// Create our database queries.
	queries := database.New(db)

	patternsArray, err := dbcollection.NewDBArray(context.Background(), queries.LastModifiedPatternConsts, queries.GetPatternConsts)
	if err != nil {
		fmt.Printf("Error creating PatternsArray: %v\n", err)
		return
	}

	// Create the api handler
	handler := apiHandler.New(queries, patternsArray)

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

	// Helper function to register standard CRUD routes for a resource
	reg := func(path string, create, list, get, update, delete echo.HandlerFunc) {
		apiGroup.POST(path, create)
		apiGroup.GET(path, list)
		apiGroup.GET(path+"/:id", get)
		apiGroup.PUT(path+"/:id", update)
		apiGroup.DELETE(path+"/:id", delete)
	}

	// Register Routes
	reg("/image_locations", handler.CreateImageLocation, handler.ListImageLocations, handler.GetImageLocation, handler.UpdateImageLocation, handler.DeleteImageLocation)
	apiGroup.GET("/image_locations/:id/preview_scan", handler.PreviewImageLocationScan)

	reg("/venues", handler.CreateVenue, handler.ListVenues, handler.GetVenue, handler.UpdateVenue, handler.DeleteVenue)
	reg("/venue_aliases", handler.CreateVenueAlias, handler.ListVenueAliases, handler.GetVenueAlias, handler.UpdateVenueAlias, handler.DeleteVenueAlias)
	reg("/promoters", handler.CreatePromoter, handler.ListPromoters, handler.GetPromoter, handler.UpdatePromoter, handler.DeletePromoter)
	reg("/promoter_aliases", handler.CreatePromoterAlias, handler.ListPromoterAliases, handler.GetPromoterAlias, handler.UpdatePromoterAlias, handler.DeletePromoterAlias)
	reg("/performers", handler.CreatePerformer, handler.ListPerformers, handler.GetPerformer, handler.UpdatePerformer, handler.DeletePerformer)
	reg("/performer_aliases", handler.CreatePerformerAlias, handler.ListPerformerAliases, handler.GetPerformerAlias, handler.UpdatePerformerAlias, handler.DeletePerformerAlias)
	reg("/festivals", handler.CreateFestival, handler.ListFestivals, handler.GetFestival, handler.UpdateFestival, handler.DeleteFestival)
	reg("/festival_aliases", handler.CreateFestivalAlias, handler.ListFestivalAliases, handler.GetFestivalAlias, handler.UpdateFestivalAlias, handler.DeleteFestivalAlias)
	reg("/event_types", handler.CreateEventType, handler.ListEventTypes, handler.GetEventType, handler.UpdateEventType, handler.DeleteEventType)
	reg("/stage_roles", handler.CreateStageRole, handler.ListStageRoles, handler.GetStageRole, handler.UpdateStageRole, handler.DeleteStageRole)

	// Serve static frontend files.
	e.Static("/", "../docs/content/admin.gig-calendar.com")

	// Start the server.
	log.Println("Starting server on :8080")
	if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
