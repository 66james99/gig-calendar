package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	
	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

type festivalAliasPayload struct {
	FestivalID int32  `json:"festival_id"`
	Alias      string `json:"alias"`
}

// --- Festival Alias Handlers ---

func (a *API) CreateFestivalAlias(c *echo.Context) error {
	var payload festivalAliasPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.CreateFestivalAliasParams{
		Festival:   payload.FestivalID,
		Alias:      payload.Alias,
	}

	alias, err := a.queries.CreateFestivalAlias(c.Request().Context(), params)
	if err != nil {
		log.Printf("Error creating festival alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create festival alias"})
	}

	return c.JSON(http.StatusCreated, alias)
}

func (a *API) ListFestivalAliases(c *echo.Context) error {
	aliases, err := a.queries.ListFestivalAliases(c.Request().Context())
	if err != nil {
		log.Printf("Error listing festival aliases: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve festival aliases"})
	}
	return c.JSON(http.StatusOK, aliases)
}

func (a *API) GetFestivalAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	alias, err := a.queries.GetFestivalAlias(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Festival alias not found"})
		}
		log.Printf("Error getting festival alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve festival alias"})
	}

	return c.JSON(http.StatusOK, alias)
}

func (a *API) UpdateFestivalAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload festivalAliasPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdateFestivalAliasParams{
		ID:         int32(id),
		Festival:   payload.FestivalID,
		Alias:      payload.Alias,
	}

	updatedAlias, err := a.queries.UpdateFestivalAlias(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Festival alias not found"})
		}
		log.Printf("Error updating festival alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update festival alias"})
	}

	return c.JSON(http.StatusOK, updatedAlias)
}

func (a *API) DeleteFestivalAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeleteFestivalAlias(c.Request().Context(), int32(id))
	if err != nil {
		log.Printf("Error deleting festival alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete festival alias"})
	}

	return c.NoContent(http.StatusNoContent)
}
