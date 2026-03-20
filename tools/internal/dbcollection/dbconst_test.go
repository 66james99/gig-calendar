package dbcollection

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestNewDBConst(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "my_table"
	column := "my_col"
	ts := time.Now()

	// 1. NewDBConst calls GetConstValues
	//    a. QueryRowContext for metadata
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	//    b. QueryContext for data (lastModified > c.lastModified(zero))
	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("val1").AddRow("val2"))

	c, err := NewDBConst[string](ctx, db, column, table)
	if err != nil {
		t.Fatalf("NewDBConst returned error: %v", err)
	}

	vals := c.Get()
	if len(vals) != 2 {
		t.Errorf("got %d values, want 2", len(vals))
	}
	if vals[0] != "val1" || vals[1] != "val2" {
		t.Errorf("got values %v, want [val1, val2]", vals)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestGetConstValues_Cached(t *testing.T) {
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

	c, err := NewDBConst[string](ctx, db, column, table)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}

	// Test: Call GetConstValues again with SAME timestamp
	// Should only query metadata, not the table
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	if err := c.GetConstValues(ctx); err != nil {
		t.Errorf("GetConstValues failed: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("expectations not met: %s", err)
	}
}

func TestGetConstValues_Refresh(t *testing.T) {
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

	c, err := NewDBConst[string](ctx, db, column, table)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}

	// Test: Call GetConstValues with NEW timestamp
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts2))

	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("new_val"))

	if err := c.GetConstValues(ctx); err != nil {
		t.Errorf("GetConstValues failed: %v", err)
	}

	vals := c.Get()
	if len(vals) != 1 || vals[0] != "new_val" {
		t.Errorf("expected [new_val], got %v", vals)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("expectations not met: %s", err)
	}
}

func TestNewDBConst_Errors(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "error_table"
	column := "error_col"

	// Case 1: Metadata query fails
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta").
		WithArgs(table).
		WillReturnError(errors.New("meta error"))

	_, err = NewDBConst[int](ctx, db, column, table)
	if err == nil {
		t.Error("expected error when metadata query fails, got nil")
	}

	// Case 2: Data query fails
	// First meta succeeds
	ts := time.Now()
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	// Then data fails
	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnError(errors.New("data error"))

	_, err = NewDBConst[int](ctx, db, column, table)
	if err == nil {
		t.Error("expected error when data query fails, got nil")
	}
}
