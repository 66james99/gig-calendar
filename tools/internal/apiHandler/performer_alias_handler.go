package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

// performerAliasPayload defines the shape of the JSON body for performer alias create and update requests.
type performerAliasPayload struct {
	PerformerID int32  `json:"performer_id"`
	Alias       string `json:"alias"`
}

func (a *API) CreatePerformerAlias(c *echo.Context) error {
	var payload performerAliasPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.CreatePerformerAliasParams{
		Performer: payload.PerformerID,
		Alias:     payload.Alias,
	}

	newAlias, err := a.queries.CreatePerformerAlias(c.Request().Context(), params)
	if err != nil {
		log.Printf("Error creating performer alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create performer alias"})
	}

	return c.JSON(http.StatusCreated, newAlias)
}

func (a *API) ListPerformerAliases(c *echo.Context) error {
	aliases, err := a.queries.ListPerformerAliases(c.Request().Context())
	if err != nil {
		log.Printf("Error listing performer aliases: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve performer aliases"})
	}
	return c.JSON(http.StatusOK, aliases)
}

func (a *API) GetPerformerAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	alias, err := a.queries.GetPerformerAlias(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Performer alias not found"})
		}
		log.Printf("Error getting performer alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve performer alias"})
	}

	return c.JSON(http.StatusOK, alias)
}

func (a *API) UpdatePerformerAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload performerAliasPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdatePerformerAliasParams{
		ID:        int32(id),
		Performer: payload.PerformerID,
		Alias:     payload.Alias,
	}

	updatedAlias, err := a.queries.UpdatePerformerAlias(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Performer alias not found"})
		}
		log.Printf("Error updating performer alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update performer alias"})
	}

	return c.JSON(http.StatusOK, updatedAlias)
}

func (a *API) DeletePerformerAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeletePerformerAlias(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Performer alias not found"})
		}
		log.Printf("Error deleting performer alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete performer alias"})
	}

	return c.NoContent(http.StatusNoContent)
}
