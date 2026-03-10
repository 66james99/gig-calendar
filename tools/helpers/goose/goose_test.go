package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateMigrationsDir(t *testing.T) {
	t.Run("valid directory with sql file", func(t *testing.T) {
		tempDir := t.TempDir()
		dummySQLPath := filepath.Join(tempDir, "0001_init.sql")
		if err := os.WriteFile(dummySQLPath, []byte("-- goose up"), 0644); err != nil {
			t.Fatalf("Failed to create dummy sql file: %v", err)
		}

		err := validateMigrationsDir(tempDir)
		if err != nil {
			t.Errorf("Expected no error, got: %v", err)
		}
	})

	t.Run("directory does not exist", func(t *testing.T) {
		nonExistentDir := filepath.Join(t.TempDir(), "nonexistent")
		err := validateMigrationsDir(nonExistentDir)
		if err == nil {
			t.Fatal("Expected an error for non-existent directory, got nil")
		}
		if !strings.Contains(err.Error(), "not found") {
			t.Errorf("Expected error to contain 'not found', got: %v", err)
		}
	})

	t.Run("path is a file, not a directory", func(t *testing.T) {
		tempDir := t.TempDir()
		filePath := filepath.Join(tempDir, "file.txt")
		if err := os.WriteFile(filePath, []byte("i am a file"), 0644); err != nil {
			t.Fatalf("Failed to create dummy file: %v", err)
		}

		err := validateMigrationsDir(filePath)
		if err == nil {
			t.Fatal("Expected an error when path is a file, got nil")
		}
		if !strings.Contains(err.Error(), "is not a directory") {
			t.Errorf("Expected error to contain 'is not a directory', got: %v", err)
		}
	})

	t.Run("directory is empty", func(t *testing.T) {
		tempDir := t.TempDir()
		err := validateMigrationsDir(tempDir)
		if err == nil {
			t.Fatal("Expected an error for an empty directory, got nil")
		}
		if !strings.Contains(err.Error(), "contains no .sql files") {
			t.Errorf("Expected error to contain 'contains no .sql files', got: %v", err)
		}
	})

	t.Run("directory contains non-sql files", func(t *testing.T) {
		tempDir := t.TempDir()
		otherFilePath := filepath.Join(tempDir, "README.md")
		if err := os.WriteFile(otherFilePath, []byte("docs"), 0644); err != nil {
			t.Fatalf("Failed to create dummy file: %v", err)
		}

		err := validateMigrationsDir(tempDir)
		if err == nil {
			t.Fatal("Expected an error for directory with no sql files, got nil")
		}
		if !strings.Contains(err.Error(), "contains no .sql files") {
			t.Errorf("Expected error to contain 'contains no .sql files', got: %v", err)
		}
	})
}

func TestGooseHelper_Failures(t *testing.T) {
	// Create a dummy credentials file and migrations dir for tests that pass validation
	tempDir := t.TempDir()
	dummyCredsPath := filepath.Join(tempDir, "creds.json")
	if err := os.WriteFile(dummyCredsPath, []byte("{}"), 0644); err != nil {
		t.Fatalf("Failed to create dummy credentials file: %v", err)
	}

	migrationsDir := filepath.Join(tempDir, "migrations")
	if err := os.Mkdir(migrationsDir, 0755); err != nil {
		t.Fatalf("Failed to create dummy migrations dir: %v", err)
	}
	dummySQLPath := filepath.Join(migrationsDir, "0001_init.sql")
	if err := os.WriteFile(dummySQLPath, []byte("-- goose up"), 0644); err != nil {
		t.Fatalf("Failed to create dummy sql file: %v", err)
	}

	// A base environment that should pass most validation checks,
	// allowing us to test one failure at a time.
	baseEnv := map[string]string{
		"DB_GSM_CREDENTIALS_PATH":     dummyCredsPath,
		"DB_HOST":                     "localhost",
		"DB_ADMIN_USER":               "test",
		"DB_ADMIN_PASSWORD_SECRET_ID": "projects/proj/secrets/sec/versions/1",
		"DB_NAME_DEV":                 "test_db",
		"DB_NAME":                     "prod_db",
		"DB_MIGRATIONS_DIR":           migrationsDir,
	}

	tests := []struct {
		name     string
		args     []string
		env      map[string]string // Env vars to override/set for this specific test
		wantExit int
		wantOut  string
	}{
		{name: "No arguments", args: []string{}, wantExit: 1, wantOut: "Usage:"},
		{name: "One argument", args: []string{"status"}, wantExit: 1, wantOut: "Usage:"},
		{name: "Invalid command", args: []string{"invalid", "dev"}, wantExit: 1, wantOut: "Invalid command 'invalid'"},
		{name: "Invalid environment", args: []string{"status", "staging"}, wantExit: 1, wantOut: "Invalid environment 'staging'"},
		{
			name:     "Missing DB_GSM_CREDENTIALS_PATH",
			args:     []string{"status", "dev"},
			env:      map[string]string{"DB_GSM_CREDENTIALS_PATH": ""},
			wantExit: 1,
			wantOut:  "DB_GSM_CREDENTIALS_PATH not set",
		},
		{
			name:     "Missing DB_HOST",
			args:     []string{"status", "dev"},
			env:      map[string]string{"DB_HOST": ""},
			wantExit: 1,
			wantOut:  "missing required DB environment variables: DB_HOST",
		},
		{
			name:     "Missing DB_ADMIN_USER",
			args:     []string{"status", "dev"},
			env:      map[string]string{"DB_ADMIN_USER": ""},
			wantExit: 1,
			wantOut:  "missing required DB environment variables: DB_ADMIN_USER",
		},
		{
			name:     "Missing DB_ADMIN_PASSWORD_SECRET_ID",
			args:     []string{"status", "dev"},
			env:      map[string]string{"DB_ADMIN_PASSWORD_SECRET_ID": ""},
			wantExit: 1,
			wantOut:  "missing required DB environment variables: DB_ADMIN_PASSWORD_SECRET_ID",
		},
		{
			name:     "Missing DB_NAME_DEV",
			args:     []string{"status", "dev"},
			env:      map[string]string{"DB_NAME_DEV": ""},
			wantExit: 1,
			wantOut:  "missing required DB environment variables: DB_NAME_DEV",
		},
		{
			name: "Missing DB_NAME for prod",
			args: []string{"status", "prod"},
			// baseEnv has DB_NAME, so we must unset it.
			// An empty value in the `env` map for a test case will override the `baseEnv`.
			env:      map[string]string{"DB_NAME": ""},
			wantExit: 1,
			wantOut:  "missing required DB environment variables: DB_NAME",
		},
		{
			name:     "Missing migrations directory",
			args:     []string{"status", "dev"},
			env:      map[string]string{"DB_MIGRATIONS_DIR": "/non/existent/path"},
			wantExit: 1,
			wantOut:  "migrations directory '/non/existent/path' not found",
		},
		{
			name:     "Empty migrations directory",
			args:     []string{"status", "dev"},
			env:      map[string]string{"DB_MIGRATIONS_DIR": t.TempDir()},
			wantExit: 1,
			wantOut:  "contains no .sql files",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmdArgs := append([]string{"run", "goose.go"}, tt.args...)
			cmd := exec.Command("go", cmdArgs...)

			// Set up environment. Start with parent, add base, then add test-specific overrides.
			cmd.Env = os.Environ()
			for k, v := range baseEnv {
				cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", k, v))
			}
			for k, v := range tt.env {
				cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", k, v))
			}

			out, err := cmd.CombinedOutput()
			output := string(out)

			exitCode := 0
			if err != nil {
				if exitErr, ok := err.(*exec.ExitError); ok {
					exitCode = exitErr.ExitCode()
				} else {
					t.Fatalf("Failed to run command: %v", err)
				}
			}

			if exitCode != tt.wantExit {
				t.Errorf("Expected exit code %d, got %d. Output:\n%s", tt.wantExit, exitCode, output)
			}

			if !strings.Contains(output, tt.wantOut) {
				t.Errorf("Expected output to contain %q, got:\n%s", tt.wantOut, output)
			}
		})
	}
}
