package dbcollection

import (
	"context"
	"errors"
	"sync"
	"time"
)

type DBArray[T any] struct {
	mu               sync.RWMutex
	consts           []T
	lastModified     time.Time
	lastModifiedFunc func(context.Context) (time.Time, error)
	dataFunc         func(context.Context) ([]T, error)
	dbQueried        int
	dbNotQueried     int
}

// func (q *Queries) LastModifiedArrays(ctx context.Context, tableName string) (time.Time, error)

// NewDBArray creates a new DBArray instance with the specified column and table.
func NewDBArray[T any](ctx context.Context, lastModifiedFunc func(context.Context) (time.Time, error), dataFunc func(context.Context) ([]T, error)) (*DBArray[T], error) {
	if lastModifiedFunc == nil {
		return nil, errors.New("lastModifiedFunc cannot be nil")
	}
	if dataFunc == nil {
		return nil, errors.New("dataFunc cannot be nil")
	}
	c := &DBArray[T]{
		lastModifiedFunc: lastModifiedFunc,
		dataFunc:         dataFunc,
		dbQueried:        0,
		dbNotQueried:     0,
	}
	// Use the Update function to create the initial population of the array
	if err := c.UpdateArrayValues(ctx); err != nil {
		return nil, err
	}
	return c, nil
}

// UpdateArrayValues populates the array DBArray.consts with data from the configured column and table.
func (c *DBArray[T]) UpdateArrayValues(ctx context.Context) error {
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
	if items == nil {
		items = make([]T, 0)
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	c.consts = items
	c.lastModified = lastModified
	c.dbQueried++

	return nil
}

// Get returns the cached values in a thread-safe manner.
func (c *DBArray[T]) Get() []T {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.consts
}

// GetDBQueried returns the number of times the database was queried for the main data.
func (c *DBArray[T]) GetDBQueried() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.dbQueried
}

// GetDBNotQueried returns the number of times the data was served from cache.
func (c *DBArray[T]) GetDBNotQueried() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.dbNotQueried
}

func (c *DBArray[T]) incrementNotQueried() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.dbNotQueried++
}
