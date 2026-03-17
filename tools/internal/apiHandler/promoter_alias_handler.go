package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

// promoterAliasPayload defines the shape of the JSON body for promoter alias create and update requests.
type promoterAliasPayload struct {
	PromoterID int32  `json:"promoter_id"`
	Alias      string `json:"alias"`
}

func (a *API) CreatePromoterAlias(c *echo.Context) error {
	var payload promoterAliasPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.CreatePromoterAliasParams{
		Promoter: payload.PromoterID,
		Alias:    payload.Alias,
	}

	newAlias, err := a.queries.CreatePromoterAlias(c.Request().Context(), params)
	if err != nil {
		log.Printf("Error creating promoter alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create promoter alias"})
	}

	return c.JSON(http.StatusCreated, newAlias)
}

func (a *API) ListPromoterAliases(c *echo.Context) error {
	aliases, err := a.queries.ListPromoterAliases(c.Request().Context())
	if err != nil {
		log.Printf("Error listing promoter aliases: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve promoter aliases"})
	}
	return c.JSON(http.StatusOK, aliases)
}

func (a *API) GetPromoterAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	alias, err := a.queries.GetPromoterAlias(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Promoter alias not found"})
		}
		log.Printf("Error getting promoter alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve promoter alias"})
	}

	return c.JSON(http.StatusOK, alias)
}

func (a *API) UpdatePromoterAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload promoterAliasPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdatePromoterAliasParams{
		ID:       int32(id),
		Promoter: payload.PromoterID,
		Alias:    payload.Alias,
	}

	updatedAlias, err := a.queries.UpdatePromoterAlias(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Promoter alias not found"})
		}
		log.Printf("Error updating promoter alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update promoter alias"})
	}

	return c.JSON(http.StatusOK, updatedAlias)
}

func (a *API) DeletePromoterAlias(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeletePromoterAlias(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Promoter alias not found"})
		}
		log.Printf("Error deleting promoter alias: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete promoter alias"})
	}

	return c.NoContent(http.StatusNoContent)
}
