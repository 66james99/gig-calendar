package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

type promoterPayload struct {
	Name string `json:"name"`
}

func (a *API) CreatePromoter(c *echo.Context) error {
	var payload promoterPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	newPromoter, err := a.queries.CreatePromoter(c.Request().Context(), payload.Name)
	if err != nil {
		log.Printf("Error creating promoter: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create promoter"})
	}

	return c.JSON(http.StatusCreated, newPromoter)
}

func (a *API) ListPromoters(c *echo.Context) error {
	promoters, err := a.queries.ListPromoters(c.Request().Context())
	if err != nil {
		log.Printf("Error listing promoters: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve promoters"})
	}
	return c.JSON(http.StatusOK, promoters)
}

func (a *API) GetPromoter(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	promoter, err := a.queries.GetPromoter(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Promoter not found"})
		}
		log.Printf("Error getting promoter: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve promoter"})
	}

	return c.JSON(http.StatusOK, promoter)
}

func (a *API) UpdatePromoter(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload promoterPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdatePromoterParams{
		Name: payload.Name,
		ID:   int32(id),
	}

	updatedPromoter, err := a.queries.UpdatePromoter(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Promoter not found"})
		}
		log.Printf("Error updating promoter: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update promoter"})
	}

	return c.JSON(http.StatusOK, updatedPromoter)
}

func (a *API) DeletePromoter(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeletePromoter(c.Request().Context(), int32(id))
	if err != nil {
		log.Printf("Error deleting promoter: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete promoter"})
	}
	return c.NoContent(http.StatusNoContent)
}
