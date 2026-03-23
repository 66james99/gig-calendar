package dbcollection

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestNewDBMap(t *testing.T) {
	ctx := context.Background()
	ts := time.Now()
	mockData := map[string]int{"one": 1, "two": 2}

	lastModifiedFunc := func(ctx context.Context) (time.Time, error) {
		return ts, nil
	}
	dataFunc := func(ctx context.Context) (map[string]int, error) {
		return mockData, nil
	}

	m, err := NewDBMap(ctx, lastModifiedFunc, dataFunc)
	if err != nil {
		t.Fatalf("NewDBMap returned error: %v", err)
	}

	val, ok := m.GetValue("one")
	if !ok || val != 1 {
		t.Errorf("GetValue(one) got %d, %v, want 1, true", val, ok)
	}

	fullMap := m.Get()
	if len(fullMap) != 2 {
		t.Errorf("Get() returned map of size %d, want 2", len(fullMap))
	}

	if m.GetDBQueried() != 1 {
		t.Errorf("got dbQueried %d, want 1", m.GetDBQueried())
	}
	if m.GetDBNotQueried() != 0 {
		t.Errorf("got dbNotQueried %d, want 0", m.GetDBNotQueried())
	}
}

func TestUpdateMapValues_Cached(t *testing.T) {
	ctx := context.Background()
	ts := time.Now()
	queryCount := 0

	lastModifiedFunc := func(ctx context.Context) (time.Time, error) {
		return ts, nil
	}
	dataFunc := func(ctx context.Context) (map[string]int, error) {
		queryCount++
		return map[string]int{"one": 1}, nil
	}

	m, err := NewDBMap(ctx, lastModifiedFunc, dataFunc)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}

	if m.GetDBQueried() != 1 || queryCount != 1 {
		t.Errorf("after initial load, got dbQueried %d, queryCount %d, want 1, 1", m.GetDBQueried(), queryCount)
	}

	// Test: Call UpdateMapValues again with SAME timestamp
	if err := m.UpdateMapValues(ctx); err != nil {
		t.Errorf("UpdateMapValues failed: %v", err)
	}

	if m.GetDBQueried() != 1 || queryCount != 1 {
		t.Errorf("after cached call, got dbQueried %d, queryCount %d, want 1, 1", m.GetDBQueried(), queryCount)
	}
	if m.GetDBNotQueried() != 1 {
		t.Errorf("after cached call, got dbNotQueried %d, want 1", m.GetDBNotQueried())
	}
}

func TestUpdateMapValues_Refresh(t *testing.T) {
	ctx := context.Background()
	ts1 := time.Now().Add(-1 * time.Hour)
	ts2 := time.Now()
	queryCount := 0
	updateCount := 0

	lastModifiedFunc := func(ctx context.Context) (time.Time, error) {
		updateCount++
		if updateCount <= 1 {
			return ts1, nil
		}
		return ts2, nil
	}
	dataFunc := func(ctx context.Context) (map[string]int, error) {
		queryCount++
		if queryCount == 1 {
			return map[string]int{"old": 0}, nil
		}
		return map[string]int{"new": 1}, nil
	}

	m, err := NewDBMap(ctx, lastModifiedFunc, dataFunc)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}

	val, ok := m.GetValue("old")
	if !ok || val != 0 {
		t.Errorf("initial load failed, expected 'old' key")
	}

	// Test: Call UpdateMapValues with NEW timestamp
	if err := m.UpdateMapValues(ctx); err != nil {
		t.Errorf("UpdateMapValues failed: %v", err)
	}

	newVal, newOk := m.GetValue("new")
	if !newOk || newVal != 1 {
		t.Errorf("refresh failed, expected 'new' key, got val %d, ok %v", newVal, newOk)
	}

	if m.GetDBQueried() != 2 {
		t.Errorf("after refresh, got dbQueried %d, want 2", m.GetDBQueried())
	}
}

func TestNewDBMap_Errors(t *testing.T) {
	ctx := context.Background()

	// Case 1: Nil functions
	_, err := NewDBMap(ctx, nil, func(ctx context.Context) (map[string]int, error) { return nil, nil })
	if err == nil || err.Error() != "lastModifiedFunc cannot be nil" {
		t.Errorf("expected error for nil lastModifiedFunc, got %v", err)
	}
	_, err = NewDBMap[string, int](ctx, func(ctx context.Context) (time.Time, error) { return time.Time{}, nil }, nil)
	if err == nil || err.Error() != "dataFunc cannot be nil" {
		t.Errorf("expected error for nil dataFunc, got %v", err)
	}

	// Case 2: Metadata query fails
	_, err = NewDBMap(ctx,
		func(ctx context.Context) (time.Time, error) { return time.Time{}, errors.New("meta error") },
		func(ctx context.Context) (map[string]int, error) { return nil, nil },
	)
	if err == nil || err.Error() != "meta error" {
		t.Errorf("expected meta error, got %v", err)
	}

	// Case 3: Data query fails
	_, err = NewDBMap(ctx,
		func(ctx context.Context) (time.Time, error) { return time.Now(), nil },
		func(ctx context.Context) (map[string]int, error) { return nil, errors.New("data error") },
	)
	if err == nil || err.Error() != "data error" {
		t.Errorf("expected data error, got %v", err)
	}
}

func TestNewDBMap_NilReturn(t *testing.T) {
	ctx := context.Background()
	m, err := NewDBMap(ctx,
		func(_ context.Context) (time.Time, error) { return time.Now(), nil },
		func(_ context.Context) (map[string]int, error) { return nil, nil },
	)
	if err != nil {
		t.Fatalf("NewDBMap failed: %v", err)
	}
	if m.Get() == nil {
		t.Error("Get() returned nil, expected empty map")
	}
	if len(m.Get()) != 0 {
		t.Error("Get() returned non-empty map, expected empty map")
	}
}
