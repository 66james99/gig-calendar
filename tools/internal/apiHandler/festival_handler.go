package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

// festivalPayload defines the JSON body for creating/updating a festival.
type festivalPayload struct {
	PromoterID  int32     `json:"promoter_id"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Description *string   `json:"description"`
}

// festivalAliasPayload defines the JSON body for creating/updating a festival alias.
type festivalAliasPayload struct {
	FestivalID int32  `json:"festival_id"`
	Alias      string `json:"alias"`
}

// --- Festival Handlers ---

func (a *API) CreateFestival(c *echo.Context) error {
	var payload festivalPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.CreateFestivalParams{
		PromoterID:  payload.PromoterID,
		StartDate:   payload.StartDate,
		EndDate:     payload.EndDate,
		Description: sql.NullString{String: "", Valid: false},
	}
	if payload.Description != nil {
		params.Description = sql.NullString{String: *payload.Description, Valid: true}
	}

	festival, err := a.queries.CreateFestival(c.Request().Context(), params)
	if err != nil {
		log.Printf("Error creating festival: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create festival"})
	}

	return c.JSON(http.StatusCreated, festival)
}

func (a *API) ListFestivals(c *echo.Context) error {
	festivals, err := a.queries.ListFestivals(c.Request().Context())
	if err != nil {
		log.Printf("Error listing festivals: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve festivals"})
	}
	return c.JSON(http.StatusOK, festivals)
}

func (a *API) GetFestival(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	festival, err := a.queries.GetFestival(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Festival not found"})
		}
		log.Printf("Error getting festival: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve festival"})
	}

	return c.JSON(http.StatusOK, festival)
}

func (a *API) UpdateFestival(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload festivalPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdateFestivalParams{
		ID:          int32(id),
		PromoterID:  payload.PromoterID,
		StartDate:   payload.StartDate,
		EndDate:     payload.EndDate,
		Description: sql.NullString{String: "", Valid: false},
	}
	if payload.Description != nil {
		params.Description = sql.NullString{String: *payload.Description, Valid: true}
	}

	updatedFestival, err := a.queries.UpdateFestival(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Festival not found"})
		}
		log.Printf("Error updating festival: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update festival"})
	}

	return c.JSON(http.StatusOK, updatedFestival)
}

func (a *API) DeleteFestival(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeleteFestival(c.Request().Context(), int32(id))
	if err != nil {
		log.Printf("Error deleting festival: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete festival"})
	}

	return c.NoContent(http.StatusNoContent)
}

