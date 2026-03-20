package apiHandler

import (

	"github.com/66james99/gig-calendar/internal/database"
)

// API holds the database queries, making them available to handlers.
type API struct {
	queries *database.Queries
}

// New creates a new API handler instance.
func New(queries *database.Queries) *API {
	return &API{
		queries: queries,
	}
}