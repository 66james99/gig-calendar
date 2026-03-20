package apiHandler

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/labstack/echo/v5"
)

type stageRolePayload struct {
	Name string `json:"name"`
}

func (a *API) CreateStageRole(c *echo.Context) error {
	var payload stageRolePayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	role, err := a.queries.CreateStageRole(c.Request().Context(), payload.Name)
	if err != nil {
		log.Printf("Error creating stage role: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create stage role"})
	}

	return c.JSON(http.StatusCreated, role)
}

func (a *API) ListStageRoles(c *echo.Context) error {
	roles, err := a.queries.ListStageRoles(c.Request().Context())
	if err != nil {
		log.Printf("Error listing stage roles: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve stage roles"})
	}
	return c.JSON(http.StatusOK, roles)
}

func (a *API) GetStageRole(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	role, err := a.queries.GetStageRole(c.Request().Context(), int32(id))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Stage role not found"})
		}
		log.Printf("Error getting stage role: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to retrieve stage role"})
	}

	return c.JSON(http.StatusOK, role)
}

func (a *API) UpdateStageRole(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	var payload stageRolePayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	params := database.UpdateStageRoleParams{
		Name: payload.Name,
		ID:   int32(id),
	}

	role, err := a.queries.UpdateStageRole(c.Request().Context(), params)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Stage role not found"})
		}
		log.Printf("Error updating stage role: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update stage role"})
	}

	return c.JSON(http.StatusOK, role)
}

func (a *API) DeleteStageRole(c *echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid ID format"})
	}

	err = a.queries.DeleteStageRole(c.Request().Context(), int32(id))
	if err != nil {
		log.Printf("Error deleting stage role: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete stage role"})
	}

	return c.NoContent(http.StatusNoContent)
}
