package apiHandler

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	// "github.com/66james99/gig-calendar/internal/metadata"
	"github.com/66james99/gig-calendar/internal/metadata/images"
	"github.com/labstack/echo/v5"
)



// imageLocationPayload defines the shape of the JSON body for create and update requests.
type imageLocationPayload struct {
	Root          string   `json:"root"`
	Pattern       string   `json:"pattern"`
	DateFromExif  bool     `json:"date_from_exif"`
	IncludeParent bool     `json:"include_parent"`
	IgnoreDirs    []string `json:"ignore_dirs"`
	Active        bool     `json:"active"`
}

func (a *API) CreateImageLocation(c *echo.Context) error {
	var payload imageLocationPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.CreateImageLocationParams{
		Root:          payload.Root,
		Pattern:       payload.Pattern,
		DateFromExif:  payload.DateFromExif,
		IncludeParent: payload.IncludeParent,
		IgnoreDirs:    payload.IgnoreDirs,
		Active:        payload.Active,
	}

	newLocation, err := a.queries.CreateImageLocation(c.Request().Context(), params)
	if err != nil {
		log.Printf("Error creating image location: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create image location"})
	}

	return c.JSON(http.StatusCreated, newLocation)
}

func (a *API) ListImageLocations(c *echo.Context) error {
	locations, err := a.queries.ListImageLocations(c.Request().Context())
	if err != nil {
		log.Printf("Error listing image locations: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve image locations"})
	}
	return c.JSON(http.StatusOK, locations)
}

func (a *API) GetImageLocation(c *echo.Context) error {
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

func (a *API) UpdateImageLocation(c *echo.Context) error {
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
		IgnoreDirs:    payload.IgnoreDirs,
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

func (a *API) DeleteImageLocation(c *echo.Context) error {
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

// PreviewImageLocationScan uses the logic from the 'finder' tool to show what
// directories would be found and how they would be parsed for a given image_location config.
func (a *API) PreviewImageLocationScan(c *echo.Context) error {
	// 1. Get the ID from the URL parameter.
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	// 2. Fetch the image_location configuration from the database.
	location, err := a.queries.GetImageLocation(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Image location not found"})
		}
		log.Printf("Error getting image location for scan preview: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve image location"})
	}

	// 3. Adapt the database model to the config struct used by the finder's logic.
	config := images.ImagesConfig{
		RootDir:       	location.Root,
		Pattern:       	location.Pattern,
		IncludeParent: 	location.IncludeParent,
		IgnoreDirs:    	location.IgnoreDirs,
		Queries:       	a.queries,
	}

	// 4. Execute the core logic from the finder tool.
	scanResult, err := images.ExecuteScan(config)
	if err != nil {
		log.Printf("Error executing scan for location %d: %v", id, err)
		if os.IsNotExist(err) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": fmt.Sprintf("Root directory not found: %s", config.RootDir)})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to execute scan"})
	}

	// 5. Return the results as JSON.
	return c.JSON(http.StatusOK, scanResult)
}
