package dbcollection

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/66james99/gig-calendar/internal/database"
)

type DBConst[T any] struct {
	db           *database.Queries
	mu           sync.RWMutex
	consts       []T
	lastModified time.Time
	column       string
	table        string
	dbQueried    int
	dbNotQueried int
}

// NewDBConst creates a new DBConst instance with the specified column and table.
func NewDBConst[T any](ctx context.Context, db *database.Queries, column string, table string) (*DBConst[T], error) {
	exists, err := validateColumnExistence(ctx, db, table, column)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("column %s not found in table %s", column, table)
	}

	if err := validateColumnType[T](ctx, db, column, table); err != nil {
		return nil, err
	}

	c := &DBConst[T]{
		db:           db,
		column:       column,
		table:        table,
		dbQueried:    0,
		dbNotQueried: 0,
	}
	// Use the Update function to create the inital population of the constants array
	if err := c.UpdateConstValues(ctx); err != nil {
		return nil, err
	}
	return c, nil
}

// GetConstValues populates the array DBConst.consts with data from the configured column and table.
func (c *DBConst[T]) UpdateConstValues(ctx context.Context) error {
	lastModified, err := getMetaTimestamp(ctx, c.db, c.table)
	if err != nil {
		return err
	}

	c.mu.RLock()
	if !lastModified.After(c.lastModified) {
		c.mu.RUnlock()
		c.incrementNotQueried()
		return nil
	}
	c.mu.RUnlock()

	items, err := getValues[T](ctx, c.db, c.column, c.table)
	if err != nil {
		return err
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	c.consts = items
	c.lastModified = lastModified
	c.dbQueried++

	return nil
}

// Get returns the cached constants in a thread-safe manner.
func (c *DBConst[T]) Get() []T {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.consts
}

// GetDBQueried returns the number of times the database was queried for the main data.
func (c *DBConst[T]) GetDBQueried() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.dbQueried
}

// GetDBNotQueried returns the number of times the data was served from cache.
func (c *DBConst[T]) GetDBNotQueried() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.dbNotQueried
}

func (c *DBConst[T]) incrementNotQueried() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.dbNotQueried++
}

const getDBCollectionMetaTimestamp = `-- name: GetDBCollectionMetaTimestamp :one
SELECT last_modified FROM dbcollections_meta WHERE table_name = $1
`

const validateColumnExistenceQuery = `-- name: ValidateColumnExistence :one
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2
)
`

func validateColumnExistence(ctx context.Context, db database.Queries, table string, column string) (bool, error) {
	var exists bool
	err := db.QueryRowContext(ctx, validateColumnExistenceQuery, table, column).Scan(&exists)
	return exists, err
}

func getMetaTimestamp(ctx context.Context, db database.Queries, tableName string) (time.Time, error) {
	var lastModified time.Time
	err := db.QueryRowContext(ctx, getDBCollectionMetaTimestamp, tableName).Scan(&lastModified)
	return lastModified, err
}

func getValues[T any](ctx context.Context, db database.Queries, column string, table string) ([]T, error) {
	// This function encapsulates a dynamic query that sqlc cannot generate.
	// It builds the query string and scans the results into a generic slice.
	query := fmt.Sprintf("SELECT %s FROM %s", column, table)
	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []T
	for rows.Next() {
		var i T
		if err := rows.Scan(&i); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func validateColumnType[T any](ctx context.Context, db *database.Queries, column string, table string) error {
	const query = `
SELECT data_type
FROM information_schema.columns
WHERE table_name = $1 AND column_name = $2;
`
	var dataType string
	if err := db.QueryRowContext(ctx, query, table, column).Scan(&dataType); err != nil {
		return err
	}

	var zero T
	var valid bool
	switch any(zero).(type) {
	case string:
		valid = dataType == "text" || dataType == "varchar" || dataType == "character varying" || dataType == "uuid"
	case int, int32, int64:
		valid = dataType == "integer" || dataType == "bigint" || dataType == "smallint"
	case bool:
		valid = dataType == "boolean"
	case time.Time:
		valid = dataType == "timestamp with time zone" || dataType == "timestamp without time zone"
	}
	if !valid {
		return fmt.Errorf("column %s is type %s, which is not compatible with %T", column, dataType, zero)
	}
	return nil
}
