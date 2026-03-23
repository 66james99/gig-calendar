package dbcollection

import (
	"context"
	"errors"
	"sync"
	"time"
)

// DBMap is a thread-safe, auto-refreshing map that fetches its data from a database.
// It uses a timestamp to check if the underlying data has been updated, and only
// refetches the data if necessary.
type DBMap[K Key, V Value] struct {
	mu               sync.RWMutex
	dataMap          map[K]V
	lastModified     time.Time
	lastModifiedFunc func(context.Context) (time.Time, error)
	dataFunc         func(context.Context) (map[K]V, error)
	dbQueried        int
	dbNotQueried     int
}

// NewDBMap creates a new DBMap instance.
// It requires a function to get the last modified timestamp and a function to fetch the data map.
func NewDBMap[K Key, V Value](ctx context.Context, lastModifiedFunc func(context.Context) (time.Time, error), dataFunc func(context.Context) (map[K]V, error)) (*DBMap[K, V], error) {
	if lastModifiedFunc == nil {
		return nil, errors.New("lastModifiedFunc cannot be nil")
	}
	if dataFunc == nil {
		return nil, errors.New("dataFunc cannot be nil")
	}

	m := &DBMap[K, V]{
		lastModifiedFunc: lastModifiedFunc,
		dataFunc:         dataFunc,
		dbQueried:        0,
		dbNotQueried:     0,
	}

	// Use the Update function to create the initial population of the map.
	if err := m.UpdateMapValues(ctx); err != nil {
		return nil, err
	}
	return m, nil
}

// UpdateMapValues populates the map with data from the configured source.
// It only refetches data if the lastModified timestamp has changed.
func (m *DBMap[K, V]) UpdateMapValues(ctx context.Context) error {
	lastModified, err := m.lastModifiedFunc(ctx)
	if err != nil {
		return err
	}

	m.mu.RLock()
	if !lastModified.After(m.lastModified) {
		m.mu.RUnlock()
		m.incrementNotQueried()
		return nil
	}
	m.mu.RUnlock()

	items, err := m.dataFunc(ctx)
	if err != nil {
		return err
	}
	if items == nil {
		// Ensure we have a non-nil map to avoid panics on access.
		items = make(map[K]V)
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.dataMap = items
	m.lastModified = lastModified
	m.dbQueried++

	return nil
}

// Get returns a copy of the entire cached map in a thread-safe manner.
func (m *DBMap[K, V]) Get() map[K]V {
	m.mu.RLock()
	defer m.mu.RUnlock()
	newMap := make(map[K]V, len(m.dataMap))
	for k, v := range m.dataMap {
		newMap[k] = v
	}
	return newMap
}

// GetValue returns a single value and a boolean indicating if the key was found.
func (m *DBMap[K, V]) GetValue(key K) (V, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	val, ok := m.dataMap[key]
	return val, ok
}

// GetDBQueried returns the number of times the database was queried for the main data.
func (m *DBMap[K, V]) GetDBQueried() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.dbQueried
}

// GetDBNotQueried returns the number of times the data was served from cache.
func (m *DBMap[K, V]) GetDBNotQueried() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.dbNotQueried
}

func (m *DBMap[K, V]) incrementNotQueried() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.dbNotQueried++
}
