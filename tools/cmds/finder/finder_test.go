package main

import (
	"os/exec"
	"strings"
	"testing"
)

func TestFinderCLI(t *testing.T) {
	// We assume the test is run from the directory containing finder.go
	finderSrc := "finder.go"

	tests := []struct {
		name       string
		args       []string
		wantExit   int
		wantOutput string
	}{
		{
			name: "Valid images source with all flags",
			// Flags must come before the positional argument (source)
			args:       []string{"--rootdir=/tmp", "--pattern=*.jpg", "--date_from_exif", "--dryrun", "images"},
			wantExit:   0,
			wantOutput: "Source: images",
		},
		{
			name:       "Valid tickets source with allowed flag",
			args:       []string{"--dryrun", "tickets"},
			wantExit:   0,
			wantOutput: "Source: tickets",
		},
		{
			name:       "Invalid flag for tickets source",
			args:       []string{"--rootdir=/tmp", "tickets"},
			wantExit:   1,
			wantOutput: "Error: flag --rootdir is not valid for source 'tickets'",
		},
		{
			name:       "Invalid source",
			args:       []string{"invalid"},
			wantExit:   1,
			wantOutput: "Error: invalid source 'invalid'",
		},
		{
			name:       "Missing source",
			args:       []string{},
			wantExit:   1,
			wantOutput: "Error: source parameter is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmdArgs := append([]string{"run", finderSrc}, tt.args...)
			cmd := exec.Command("go", cmdArgs...)

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

			if !strings.Contains(output, tt.wantOutput) {
				t.Errorf("Expected output to contain %q, got:\n%s", tt.wantOutput, output)
			}
		})
	}
}
