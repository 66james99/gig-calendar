package apiHandler

import (

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/66james99/gig-calendar/internal/dbcollection"
)

// API holds the database queries, making them available to handlers.
type API struct {
	queries *database.Queries
	patternsArray *dbcollection.DBArray[string]
}

// New creates a new API handler instance.
func New(queries *database.Queries, patternsArray *dbcollection.DBArray[string]) *API {
	return &API{
		queries: queries,
		patternsArray: patternsArray,
	}
}