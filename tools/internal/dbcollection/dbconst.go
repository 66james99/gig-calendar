package dbcollection

import (
	"context"
	"sync"
	"time"
)

type DBConst[T any] struct {
	mu               sync.RWMutex
	consts           []T
	lastModified     time.Time
	lastModifiedFunc func(context.Context) (time.Time, error)
	dataFunc         func(context.Context) ([]T, error)
	dbQueried        int
	dbNotQueried     int
}

// func (q *Queries) LastModifiedConsts(ctx context.Context, tableName string) (time.Time, error)

// NewDBConst creates a new DBConst instance with the specified column and table.
func NewDBConst[T any](ctx context.Context, lastModifiedFunc func(context.Context) (time.Time, error), dataFunc func(context.Context) ([]T, error)) (*DBConst[T], error) {
	c := &DBConst[T]{
		lastModifiedFunc: lastModifiedFunc,
		dataFunc:         dataFunc,
		dbQueried:        0,
		dbNotQueried:     0,
	}
	// Use the Update function to create the inital population of the constants array
	if err := c.UpdateConstValues(ctx); err != nil {
		return nil, err
	}
	return c, nil
}

// GetConstValues populates the array DBConst.consts with data from the configured column and table.
func (c *DBConst[T]) UpdateConstValues(ctx context.Context) error {
	lastModified, err := c.lastModifiedFunc(ctx)
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

	items, err := c.dataFunc(ctx)
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





