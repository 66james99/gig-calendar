package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

type performerPayload struct {
	Name string `json:"name"`
}

func (a *API) CreatePerformer(c *echo.Context) error {
	var payload performerPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	newPerformer, err := a.queries.CreatePerformer(c.Request().Context(), payload.Name)
	if err != nil {
		log.Printf("Error creating performer: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create performer"})
	}

	return c.JSON(http.StatusCreated, newPerformer)
}

func (a *API) ListPerformers(c *echo.Context) error {
	performers, err := a.queries.ListPerformers(c.Request().Context())
	if err != nil {
		log.Printf("Error listing performers: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve performers"})
	}
	return c.JSON(http.StatusOK, performers)
}

func (a *API) GetPerformer(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	performer, err := a.queries.GetPerformer(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Performer not found"})
		}
		log.Printf("Error getting performer: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve performer"})
	}

	return c.JSON(http.StatusOK, performer)
}

func (a *API) UpdatePerformer(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload performerPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdatePerformerParams{
		Name: payload.Name,
		ID:   int32(id),
	}

	updatedPerformer, err := a.queries.UpdatePerformer(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Performer not found"})
		}
		log.Printf("Error updating performer: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update performer"})
	}

	return c.JSON(http.StatusOK, updatedPerformer)
}

func (a *API) DeletePerformer(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeletePerformer(c.Request().Context(), int32(id))
	if err != nil {
		log.Printf("Error deleting performer: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete performer"})
	}
	return c.NoContent(http.StatusNoContent)
}
