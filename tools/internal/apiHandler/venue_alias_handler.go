package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

// venueAliasPayload defines the shape of the JSON body for venue alias create and update requests.
type venueAliasPayload struct {
	VenueID int32  `json:"venue_id"`
	Alias   string `json:"alias"`
}

func (a *API) CreateVenueAlias(c *echo.Context) error {
	var payload venueAliasPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.CreateVenueAliasParams{
		Venue: payload.VenueID,
		Alias: payload.Alias,
	}

	newAlias, err := a.queries.CreateVenueAlias(c.Request().Context(), params)
	if err != nil {
		log.Printf("Error creating venue alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create venue alias"})
	}

	return c.JSON(http.StatusCreated, newAlias)
}

func (a *API) ListVenueAliases(c *echo.Context) error {
	aliases, err := a.queries.ListVenueAliases(c.Request().Context())
	if err != nil {
		log.Printf("Error listing venue aliases: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve venue aliases"})
	}
	return c.JSON(http.StatusOK, aliases)
}

func (a *API) GetVenueAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	alias, err := a.queries.GetVenueAlias(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Venue alias not found"})
		}
		log.Printf("Error getting venue alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve venue alias"})
	}

	return c.JSON(http.StatusOK, alias)
}

func (a *API) UpdateVenueAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload venueAliasPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdateVenueAliasParams{
		ID:    int32(id),
		Venue: payload.VenueID,
		Alias: payload.Alias,
	}

	updatedAlias, err := a.queries.UpdateVenueAlias(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Venue alias not found"})
		}
		log.Printf("Error updating venue alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update venue alias"})
	}

	return c.JSON(http.StatusOK, updatedAlias)
}

func (a *API) DeleteVenueAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeleteVenueAlias(c.Request().Context(), int32(id))
	if err != nil {
		// sqlc's Delete methods return sql.ErrNoRows if no row was found to delete.
		// We should handle this specifically if we want to return a 404.
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Venue alias not found"})
		}
		log.Printf("Error deleting venue alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete venue alias"})
	}

	return c.NoContent(http.StatusNoContent)
}