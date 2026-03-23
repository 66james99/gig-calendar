package dbcollection

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestNewDBArray(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "my_table"
	column := "my_col"
	ts := time.Now()

	// 1. NewDBArray calls UpdateArrayValues
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("val1").AddRow("val2"))

	c, err := NewDBArray(ctx, func(ctx context.Context) (time.Time, error) {
		var t time.Time
		err := db.QueryRowContext(ctx, "SELECT last_modified FROM dbcollections_meta WHERE table_name = $1", table).Scan(&t)
		return t, err
	},
		func(ctx context.Context) ([]string, error) {
			rows, err := db.QueryContext(ctx, fmt.Sprintf("SELECT %s FROM %s", column, table))
			if err != nil {
				return nil, err
			}
			defer rows.Close()
			var items []string
			for rows.Next() {
				var s string
				if err := rows.Scan(&s); err != nil {
					return nil, err
				}
				items = append(items, s)
			}
			return items, nil
		},
	)
	if err != nil {
		t.Fatalf("NewDBArray returned error: %v", err)
	}

	vals := c.Get()
	if len(vals) != 2 {
		t.Errorf("got %d values, want 2", len(vals))
	}
	if vals[0] != "val1" || vals[1] != "val2" {
		t.Errorf("got values %v, want [val1, val2]", vals)
	}

	if c.GetDBQueried() != 1 {
		t.Errorf("got dbQueried %d, want 1", c.GetDBQueried())
	}
	if c.GetDBNotQueried() != 0 {
		t.Errorf("got dbNotQueried %d, want 0", c.GetDBNotQueried())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestUpdateArrayValues_Cached(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "my_table"
	column := "my_col"
	ts := time.Now()

	// Setup: Initial load
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("val1"))

	c, err := NewDBArray(ctx, func(ctx context.Context) (time.Time, error) {
		var t time.Time
		err := db.QueryRowContext(ctx, "SELECT last_modified FROM dbcollections_meta WHERE table_name = $1", table).Scan(&t)
		return t, err
	},
		func(ctx context.Context) ([]string, error) {
			rows, err := db.QueryContext(ctx, fmt.Sprintf("SELECT %s FROM %s", column, table))
			if err != nil {
				return nil, err
			}
			defer rows.Close()
			var items []string
			for rows.Next() {
				var s string
				if err := rows.Scan(&s); err != nil {
					return nil, err
				}
				items = append(items, s)
			}
			return items, nil
		},
	)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}

	if c.GetDBQueried() != 1 {
		t.Errorf("after initial load, got dbQueried %d, want 1", c.GetDBQueried())
	}
	if c.GetDBNotQueried() != 0 {
		t.Errorf("after initial load, got dbNotQueried %d, want 0", c.GetDBNotQueried())
	}

	// Test: Call UpdateArrayValues again with SAME timestamp
	// Should only query metadata, not the table
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	if err := c.UpdateArrayValues(ctx); err != nil {
		t.Errorf("UpdateArrayValues failed: %v", err)
	}

	if c.GetDBQueried() != 1 {
		t.Errorf("after cached call, got dbQueried %d, want 1", c.GetDBQueried())
	}
	if c.GetDBNotQueried() != 1 {
		t.Errorf("after cached call, got dbNotQueried %d, want 1", c.GetDBNotQueried())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("expectations not met: %s", err)
	}
}

func TestUpdateArrayValues_Refresh(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "my_table"
	column := "my_col"
	ts1 := time.Now().Add(-1 * time.Hour)
	ts2 := time.Now()

	// Setup: Initial load
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts1))

	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("old_val"))

	c, err := NewDBArray(ctx, func(ctx context.Context) (time.Time, error) {
		var t time.Time
		err := db.QueryRowContext(ctx, "SELECT last_modified FROM dbcollections_meta WHERE table_name = $1", table).Scan(&t)
		return t, err
	},
		func(ctx context.Context) ([]string, error) {
			rows, err := db.QueryContext(ctx, fmt.Sprintf("SELECT %s FROM %s", column, table))
			if err != nil {
				return nil, err
			}
			defer rows.Close()
			var items []string
			for rows.Next() {
				var s string
				if err := rows.Scan(&s); err != nil {
					return nil, err
				}
				items = append(items, s)
			}
			return items, nil
		},
	)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}

	if c.GetDBQueried() != 1 {
		t.Errorf("after initial load, got dbQueried %d, want 1", c.GetDBQueried())
	}
	if c.GetDBNotQueried() != 0 {
		t.Errorf("after initial load, got dbNotQueried %d, want 0", c.GetDBNotQueried())
	}

	// Test: Call UpdateArrayValues with NEW timestamp
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts2))

	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("new_val"))

	if err := c.UpdateArrayValues(ctx); err != nil {
		t.Errorf("UpdateArrayValues failed: %v", err)
	}

	vals := c.Get()
	if len(vals) != 1 || vals[0] != "new_val" {
		t.Errorf("expected [new_val], got %v", vals)
	}

	if c.GetDBQueried() != 2 {
		t.Errorf("after refresh, got dbQueried %d, want 2", c.GetDBQueried())
	}
	if c.GetDBNotQueried() != 0 {
		t.Errorf("after refresh, got dbNotQueried %d, want 0", c.GetDBNotQueried())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("expectations not met: %s", err)
	}
}

func TestNewDBArray_Errors(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "error_table"
	column := "error_col"

	// Case 1: Metadata query fails
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnError(errors.New("meta error"))

	_, err = NewDBArray(ctx, func(ctx context.Context) (time.Time, error) {
		var t time.Time
		err := db.QueryRowContext(ctx, "SELECT last_modified FROM dbcollections_meta WHERE table_name = $1", table).Scan(&t)
		return t, err
	},
		func(ctx context.Context) ([]int, error) {
			return nil, nil
		},
	)
	if err == nil {
		t.Error("expected error when metadata query fails, got nil")
	}

	// Case 2: Data query fails
	// First meta succeeds
	ts := time.Now()
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	// Then data fails
	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnError(errors.New("data error"))

	_, err = NewDBArray(ctx, func(ctx context.Context) (time.Time, error) {
		var t time.Time
		err := db.QueryRowContext(ctx, "SELECT last_modified FROM dbcollections_meta WHERE table_name = $1", table).Scan(&t)
		return t, err
	},
		func(ctx context.Context) ([]int, error) {
			_, err := db.QueryContext(ctx, fmt.Sprintf("SELECT %s FROM %s", column, table))
			return nil, err
		},
	)
	if err == nil {
		t.Error("expected error when data query fails, got nil")
	}
}
