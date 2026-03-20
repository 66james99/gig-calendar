package dbcollection

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/66james99/gig-calendar/internal/database"
)

type DBConst[T any] struct {
	db           database.DBTX
	mu           sync.RWMutex
	consts       []T
	lastModified time.Time
	column       string
	table        string
	dbQueried    int
	dbNotQueried int
}

// NewDBConst creates a new DBConst instance with the specified column and table.
func NewDBConst[T any](ctx context.Context, db database.DBTX, column string, table string) (*DBConst[T], error) {
	c := &DBConst[T]{
		db:           db,
		column:       column,
		table:        table,
		dbQueried:    0,
		dbNotQueried: 0,
	}
	if err := c.GetConstValues(ctx); err != nil {
		return nil, err
	}
	return c, nil
}

// GetConstValues populates the array DBConst.consts with data from the configured column and table.
func (c *DBConst[T]) GetConstValues(ctx context.Context) error {
	var lastModified time.Time
	if err := c.db.QueryRowContext(ctx, "SELECT last_modified FROM dbcollections_meta WHERE table_name = $1", c.table).Scan(&lastModified); err != nil {
		return err
	}
	c.mu.RLock()
	if !lastModified.After(c.lastModified) {
		c.mu.RUnlock()
		c.mu.Lock()
		c.dbNotQueried++
		c.mu.Unlock()
		return nil
	}
	c.mu.RUnlock()

	query := fmt.Sprintf("SELECT %s FROM %s", c.column, c.table)
	rows, err := c.db.QueryContext(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()

	var items []T
	for rows.Next() {
		var i T
		if err := rows.Scan(&i); err != nil {
			return err
		}
		items = append(items, i)
	}
	if err := rows.Close(); err != nil {
		return err
	}
	if err := rows.Err(); err != nil {
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
