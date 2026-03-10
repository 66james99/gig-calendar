package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

// API holds the database queries, making them available to handlers.
type API struct {
	queries *database.Queries
}

// New creates a new API handler instance.
func New(queries *database.Queries) *API {
	return &API{
		queries: queries,
	}
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
