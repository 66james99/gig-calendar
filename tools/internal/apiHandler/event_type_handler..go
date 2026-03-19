package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

type eventTypePayload struct {
	Name string `json:"name"`
}

func (a *API) CreateEventType(c *echo.Context) error {
	var payload eventTypePayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	if payload.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Name is required"})
	}

	eventType, err := a.queries.CreateEventType(c.Request().Context(), payload.Name)
	if err != nil {
		log.Printf("Error creating event type: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create event type"})
	}

	return c.JSON(http.StatusCreated, eventType)
}

func (a *API) ListEventTypes(c *echo.Context) error {
	eventTypes, err := a.queries.ListEventTypes(c.Request().Context())
	if err != nil {
		log.Printf("Error listing event types: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve event types"})
	}
	return c.JSON(http.StatusOK, eventTypes)
}

func (a *API) GetEventType(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	eventType, err := a.queries.GetEventType(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Event type not found"})
		}
		log.Printf("Error getting event type: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve event type"})
	}

	return c.JSON(http.StatusOK, eventType)
}

func (a *API) UpdateEventType(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload eventTypePayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	if payload.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Name is required"})
	}

	params := database.UpdateEventTypeParams{
		ID:   int32(id),
		Name: payload.Name,
	}

	updatedEventType, err := a.queries.UpdateEventType(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Event type not found"})
		}
		log.Printf("Error updating event type: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update event type"})
	}

	return c.JSON(http.StatusOK, updatedEventType)
}

func (a *API) DeleteEventType(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	if err := a.queries.DeleteEventType(c.Request().Context(), int32(id)); err != nil {
		log.Printf("Error deleting event type: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete event type"})
	}

	return c.NoContent(http.StatusNoContent)
}
