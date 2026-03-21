package dbcollection

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/66james99/gig-calendar/internal/database"
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

	// 1. Validate column existence
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// 2. Validate column type
	mock.ExpectQuery("SELECT data_type").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"data_type"}).AddRow("text"))

	// 3. NewDBConst calls UpdateConstValues
	//    a. QueryRowContext for metadata
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	//    b. QueryContext for data (lastModified > c.lastModified(zero))
	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("val1").AddRow("val2"))

	q := database.New(db)
	c, err := NewDBConst[string](ctx, q, column, table)
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

func TestUpdateConstValues_Cached(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "my_table"
	column := "my_col"
	ts := time.Now()

	// 1. Validate column existence
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// 2. Validate column type
	mock.ExpectQuery("SELECT data_type").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"data_type"}).AddRow("text"))

	// Setup: Initial load
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("val1"))

	q := database.New(db)
	c, err := NewDBConst[string](ctx, q, column, table)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}

	if c.GetDBQueried() != 1 {
		t.Errorf("after initial load, got dbQueried %d, want 1", c.GetDBQueried())
	}
	if c.GetDBNotQueried() != 0 {
		t.Errorf("after initial load, got dbNotQueried %d, want 0", c.GetDBNotQueried())
	}

	// Test: Call GetConstValues again with SAME timestamp
	// Should only query metadata, not the table
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	if err := c.UpdateConstValues(ctx); err != nil {
		t.Errorf("UpdateConstValues failed: %v", err)
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

func TestUpdateConstValues_Refresh(t *testing.T) {
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

	// 1. Validate column existence
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// 2. Validate column type
	mock.ExpectQuery("SELECT data_type").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"data_type"}).AddRow("text"))

	// Setup: Initial load
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts1))

	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("old_val"))

	q := database.New(db)
	c, err := NewDBConst[string](ctx, q, column, table)
	if err != nil {
		t.Fatalf("setup failed: %v", err)
	}

	if c.GetDBQueried() != 1 {
		t.Errorf("after initial load, got dbQueried %d, want 1", c.GetDBQueried())
	}
	if c.GetDBNotQueried() != 0 {
		t.Errorf("after initial load, got dbNotQueried %d, want 0", c.GetDBNotQueried())
	}

	// Test: Call GetConstValues with NEW timestamp
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta WHERE table_name = \\$1").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts2))

	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnRows(sqlmock.NewRows([]string{column}).AddRow("new_val"))

	if err := c.UpdateConstValues(ctx); err != nil {
		t.Errorf("UpdateConstValues failed: %v", err)
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

func TestNewDBConst_Errors(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "error_table"
	column := "error_col"
	q := database.New(db)

	// Case 1: Existence check fails
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	_, err = NewDBConst[int](ctx, q, column, table)
	if err == nil {
		t.Error("expected error when column does not exist, got nil")
	}

	// Case 2: Metadata query fails
	// Must pass validation first
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	mock.ExpectQuery("SELECT data_type").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"data_type"}).AddRow("integer"))

	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta").
		WithArgs(table).
		WillReturnError(errors.New("meta error"))

	_, err = NewDBConst[int](ctx, q, column, table)
	if err == nil {
		t.Error("expected error when metadata query fails, got nil")
	}

	// Case 3: Data query fails
	// Must pass validation first
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	mock.ExpectQuery("SELECT data_type").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"data_type"}).AddRow("integer"))

	// First meta succeeds
	ts := time.Now()
	mock.ExpectQuery("SELECT last_modified FROM dbcollections_meta").
		WithArgs(table).
		WillReturnRows(sqlmock.NewRows([]string{"last_modified"}).AddRow(ts))

	// Then data fails
	mock.ExpectQuery(fmt.Sprintf("SELECT %s FROM %s", column, table)).
		WillReturnError(errors.New("data error"))

	_, err = NewDBConst[int](ctx, q, column, table)
	if err == nil {
		t.Error("expected error when data query fails, got nil")
	}
}

func TestNewDBConst_InvalidColumnType(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open stub db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	table := "bad_table"
	column := "bad_col"
	q := database.New(db)

	// Existence passes
	mock.ExpectQuery("SELECT EXISTS").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	// Return a disallowed type (e.g., "bytea")
	mock.ExpectQuery("SELECT data_type").
		WithArgs(table, column).
		WillReturnRows(sqlmock.NewRows([]string{"data_type"}).AddRow("bytea"))

	_, err = NewDBConst[string](ctx, q, column, table)
	if err == nil {
		t.Error("expected error for disallowed column type, got nil")
	}
}
