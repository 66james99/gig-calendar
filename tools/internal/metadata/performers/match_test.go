package performers

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/66james99/gig-calendar/internal/database"
	"github.com/66james99/gig-calendar/internal/dbcollection"
	"github.com/66james99/gig-calendar/internal/metadata"
	"github.com/DATA-DOG/go-sqlmock"
)

func TestMultiPerformerMatch(t *testing.T) {
	tests := []struct {
		name          string
		rawPerformers string
		setupMock     func(mock sqlmock.Sqlmock)
		wantCount     int
		wantFirst     string
		wantSecond    string
	}{
		{
			name:          "Splits using 'and'",
			rawPerformers: "Alice and Bob",
			setupMock: func(mock sqlmock.Sqlmock) {
				// 1. Check full string "Alice and Bob" -> No match
				// Helpers inlined or passed mock
				mock.ExpectQuery(`-- name: GetPerformerByName :one`).WithArgs("Alice and Bob").WillReturnError(sql.ErrNoRows)
				mock.ExpectQuery(`-- name: GetPerformerAliasByName :one`).WithArgs("Alice and Bob").WillReturnError(sql.ErrNoRows)
				mock.ExpectQuery(`-- name: ListPerformers :many`).WillReturnRows(sqlmock.NewRows([]string{"id", "uuid", "created", "updated", "name"}))
				mock.ExpectQuery(`-- name: ListPerformerAliases :many`).WillReturnRows(sqlmock.NewRows([]string{"id", "uuid", "created", "updated", "performer", "alias"}))

				// 2. MultiPerformerMatch splits using " and " -> "Alice", "Bob"
				// Check "Alice"
				mock.ExpectQuery(`-- name: GetPerformerByName :one`).WithArgs("Alice").
					WillReturnRows(sqlmock.NewRows([]string{"id", "uuid", "created", "updated", "name"}).AddRow(1, "00000000-0000-0000-0000-000000000001", time.Now(), time.Now(), "Alice"))
				// Check "Bob"
				mock.ExpectQuery(`-- name: GetPerformerByName :one`).WithArgs("Bob").
					WillReturnRows(sqlmock.NewRows([]string{"id", "uuid", "created", "updated", "name"}).AddRow(2, "00000000-0000-0000-0000-000000000002", time.Now(), time.Now(), "Bob"))
			},
			wantCount:  2,
			wantFirst:  "Alice",
			wantSecond: "Bob",
		},
		{
			name:          "Splits using fuzzy 'wth'",
			rawPerformers: "Alice wth Bob",
			setupMock: func(mock sqlmock.Sqlmock) {
				// 1. Check full string -> No match
				mock.ExpectQuery(`-- name: GetPerformerByName :one`).WithArgs("Alice wth Bob").WillReturnError(sql.ErrNoRows)
				mock.ExpectQuery(`-- name: GetPerformerAliasByName :one`).WithArgs("Alice wth Bob").WillReturnError(sql.ErrNoRows)
				mock.ExpectQuery(`-- name: ListPerformers :many`).WillReturnRows(sqlmock.NewRows([]string{"id", "uuid", "created", "updated", "name"}))
				mock.ExpectQuery(`-- name: ListPerformerAliases :many`).WillReturnRows(sqlmock.NewRows([]string{"id", "uuid", "created", "updated", "performer", "alias"}))

				// 2. Splits using " with " (matched against " wth ") -> "Alice", "Bob"
				mock.ExpectQuery(`-- name: GetPerformerByName :one`).WithArgs("Alice").
					WillReturnRows(sqlmock.NewRows([]string{"id", "uuid", "created", "updated", "name"}).AddRow(1, "00000000-0000-0000-0000-000000000001", time.Now(), time.Now(), "Alice"))
				mock.ExpectQuery(`-- name: GetPerformerByName :one`).WithArgs("Bob").
					WillReturnRows(sqlmock.NewRows([]string{"id", "uuid", "created", "updated", "name"}).AddRow(2, "00000000-0000-0000-0000-000000000002", time.Now(), time.Now(), "Bob"))
			},
			wantCount:  2,
			wantFirst:  "Alice",
			wantSecond: "Bob",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to open sqlmock: %v", err)
			}
			defer db.Close()

			queries := database.New(db)

			// Setup DBArray
			patternsArray, err := dbcollection.NewDBArray(context.Background(),
				func(context.Context) (time.Time, error) { return time.Now(), nil },
				func(context.Context) ([]string, error) {
					return []string{" and ", " vs ", " & ", " with "}, nil
				},
			)
			if err != nil {
				t.Fatalf("failed to create DBArray: %v", err)
			}

			cfg := metadata.ImagesConfig{
				Queries:  queries,
				Patterns: patternsArray,
			}

			tt.setupMock(mock)

			results, err := MultiPerformerMatch(context.Background(), cfg, tt.rawPerformers)
			if err != nil {
				t.Errorf("MultiPerformerMatch() error = %v", err)
				return
			}

			if len(results) != tt.wantCount {
				t.Errorf("MultiPerformerMatch() count = %d, want %d", len(results), tt.wantCount)
			}
			if len(results) >= 1 && results[0].Name != tt.wantFirst {
				t.Errorf("Result[0] = %s, want %s", results[0].Name, tt.wantFirst)
			}
			if len(results) >= 2 && results[1].Name != tt.wantSecond {
				t.Errorf("Result[1] = %s, want %s", results[1].Name, tt.wantSecond)
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled expectations: %s", err)
			}
		})
	}
}
