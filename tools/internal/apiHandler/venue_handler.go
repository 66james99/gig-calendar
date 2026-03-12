package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

// venuePayload defines the shape of the JSON body for venue create and update requests.
type venuePayload struct {
	Name string `json:"name"`
}

func (a *API) CreateVenue(c *echo.Context) error {
	var payload venuePayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	newVenue, err := a.queries.CreateVenue(c.Request().Context(), payload.Name)
	if err != nil {
		log.Printf("Error creating venue: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create venue"})
	}

	return c.JSON(http.StatusCreated, newVenue)
}

func (a *API) ListVenues(c *echo.Context) error {
	venues, err := a.queries.ListVenues(c.Request().Context())
	if err != nil {
		log.Printf("Error listing venues: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve venues"})
	}
	return c.JSON(http.StatusOK, venues)
}

func (a *API) GetVenue(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	venue, err := a.queries.GetVenue(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Venue not found"})
		}
		log.Printf("Error getting venue: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve venue"})
	}

	return c.JSON(http.StatusOK, venue)
}

func (a *API) UpdateVenue(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload venuePayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdateVenueParams{
		ID:   int32(id),
		Name: payload.Name,
	}

	updatedVenue, err := a.queries.UpdateVenue(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Venue not found"})
		}
		log.Printf("Error updating venue: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update venue"})
	}

	return c.JSON(http.StatusOK, updatedVenue)
}

func (a *API) DeleteVenue(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeleteVenue(c.Request().Context(), int32(id))
	if err != nil {
		log.Printf("Error deleting venue: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete venue"})
	}

	return c.NoContent(http.StatusNoContent)
}
