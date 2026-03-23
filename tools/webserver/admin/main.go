package main

import (
	"flag"
	"log"
	"fmt"
	"context"
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
	handler := apiHandler.New(queries,patternsArray)

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

	// --- Image Locations Routes ---
	apiGroup.POST("/image_locations", handler.CreateImageLocation)
	apiGroup.GET("/image_locations", handler.ListImageLocations)
	apiGroup.GET("/image_locations/:id", handler.GetImageLocation)
	apiGroup.PUT("/image_locations/:id", handler.UpdateImageLocation)
	apiGroup.DELETE("/image_locations/:id", handler.DeleteImageLocation)
	apiGroup.GET("/image_locations/:id/preview_scan", handler.PreviewImageLocationScan)

	// --- Venues Routes ---
	apiGroup.POST("/venues", handler.CreateVenue)
	apiGroup.GET("/venues", handler.ListVenues)
	apiGroup.GET("/venues/:id", handler.GetVenue)
	apiGroup.PUT("/venues/:id", handler.UpdateVenue)
	apiGroup.DELETE("/venues/:id", handler.DeleteVenue)

	// --- Venue Aliases Routes ---
	apiGroup.POST("/venue_aliases", handler.CreateVenueAlias)
	apiGroup.GET("/venue_aliases", handler.ListVenueAliases)
	apiGroup.GET("/venue_aliases/:id", handler.GetVenueAlias)
	apiGroup.PUT("/venue_aliases/:id", handler.UpdateVenueAlias)
	apiGroup.DELETE("/venue_aliases/:id", handler.DeleteVenueAlias)

	// --- Promoters Routes ---
	apiGroup.POST("/promoters", handler.CreatePromoter)
	apiGroup.GET("/promoters", handler.ListPromoters)
	apiGroup.GET("/promoters/:id", handler.GetPromoter)
	apiGroup.PUT("/promoters/:id", handler.UpdatePromoter)
	apiGroup.DELETE("/promoters/:id", handler.DeletePromoter)

	// --- Promoter Aliases Routes ---
	apiGroup.POST("/promoter_aliases", handler.CreatePromoterAlias)
	apiGroup.GET("/promoter_aliases", handler.ListPromoterAliases)
	apiGroup.GET("/promoter_aliases/:id", handler.GetPromoterAlias)
	apiGroup.PUT("/promoter_aliases/:id", handler.UpdatePromoterAlias)
	apiGroup.DELETE("/promoter_aliases/:id", handler.DeletePromoterAlias)

	// --- Performers Routes ---
	apiGroup.POST("/performers", handler.CreatePerformer)
	apiGroup.GET("/performers", handler.ListPerformers)
	apiGroup.GET("/performers/:id", handler.GetPerformer)
	apiGroup.PUT("/performers/:id", handler.UpdatePerformer)
	apiGroup.DELETE("/performers/:id", handler.DeletePerformer)

	// --- Performer Aliases Routes ---
	apiGroup.POST("/performer_aliases", handler.CreatePerformerAlias)
	apiGroup.GET("/performer_aliases", handler.ListPerformerAliases)
	apiGroup.GET("/performer_aliases/:id", handler.GetPerformerAlias)
	apiGroup.PUT("/performer_aliases/:id", handler.UpdatePerformerAlias)
	apiGroup.DELETE("/performer_aliases/:id", handler.DeletePerformerAlias)

	// --- Festivals Routes ---
	apiGroup.POST("/festivals", handler.CreateFestival)
	apiGroup.GET("/festivals", handler.ListFestivals)
	apiGroup.GET("/festivals/:id", handler.GetFestival)
	apiGroup.PUT("/festivals/:id", handler.UpdateFestival)
	apiGroup.DELETE("/festivals/:id", handler.DeleteFestival)

	// --- Festival Aliases Routes ---
	apiGroup.POST("/festival_aliases", handler.CreateFestivalAlias)
	apiGroup.GET("/festival_aliases", handler.ListFestivalAliases)
	apiGroup.GET("/festival_aliases/:id", handler.GetFestivalAlias)
	apiGroup.PUT("/festival_aliases/:id", handler.UpdateFestivalAlias)
	apiGroup.DELETE("/festival_aliases/:id", handler.DeleteFestivalAlias)

	// --- Event Types Routes ---
	apiGroup.POST("/event_types", handler.CreateEventType)
	apiGroup.GET("/event_types", handler.ListEventTypes)
	apiGroup.GET("/event_types/:id", handler.GetEventType)
	apiGroup.PUT("/event_types/:id", handler.UpdateEventType)
	apiGroup.DELETE("/event_types/:id", handler.DeleteEventType)

	// --- Stage Roles Routes ---
	apiGroup.POST("/stage_roles", handler.CreateStageRole)
	apiGroup.GET("/stage_roles", handler.ListStageRoles)
	apiGroup.GET("/stage_roles/:id", handler.GetStageRole)
	apiGroup.PUT("/stage_roles/:id", handler.UpdateStageRole)
	apiGroup.DELETE("/stage_roles/:id", handler.DeleteStageRole)

	// Serve static frontend files.
	e.Static("/", "../docs/content/admin.gig-calendar.com")

	// Start the server.
	log.Println("Starting server on :8080")
	if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
