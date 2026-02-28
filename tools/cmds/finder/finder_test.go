package main

import (
	"bytes"
	"flag"
	"io"
	"os"
	"os/exec"
	"strings"
	"testing"
)

func TestFinder_Success(t *testing.T) {
	// Save global state to restore after tests
	origArgs := os.Args
	origCommandLine := flag.CommandLine
	defer func() {
		os.Args = origArgs
		flag.CommandLine = origCommandLine
	}()

	tests := []struct {
		name       string
		args       []string
		wantOutput string
	}{
		{
			name: "Valid images source with all flags",
			// args[0] is the program name
			args:       []string{"finder", "images", "--rootdir=/tmp", "--pattern=*.jpg", "--date_from_exif", "--dryrun"},
			wantOutput: "Source: images\nDryrun: true\nDateFromExif: true\nRootDir: /tmp\nPattern: *.jpg\n",
		},
		{
			name:       "Valid tickets source with allowed flag",
			args:       []string{"finder", "tickets", "--dryrun"},
			wantOutput: "Source: tickets\nDryrun: true\n",
		},
		{
			name:       "Valid info source",
			args:       []string{"finder", "info", "--dryrun"},
			wantOutput: "Source: info\nDryrun: true\n",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 1. Reset flags
			// We create a new FlagSet so parseFlags() registers flags on a clean slate.
			flag.CommandLine = flag.NewFlagSet(tt.args[0], flag.ContinueOnError)

			// 2. Set args
			os.Args = tt.args

			// 3. Capture stdout
			r, w, _ := os.Pipe()
			origStdout := os.Stdout
			os.Stdout = w

			// Ensure stdout is restored even if main panics
			defer func() {
				os.Stdout = origStdout
			}()

			// 4. Run main
			// We run this in a closure to defer the pipe closing
			done := make(chan string)
			go func() {
				var buf bytes.Buffer
				io.Copy(&buf, r)
				done <- buf.String()
			}()

			main()

			// Close write end to finish copy
			w.Close()
			output := <-done

			// 5. Assertions
			if !strings.Contains(output, tt.wantOutput) {
				t.Errorf("Expected output to contain %q, got:\n%s", tt.wantOutput, output)
			}
		})
	}
}

func TestParseArgs(t *testing.T) {
	origArgs := os.Args
	defer func() { os.Args = origArgs }()

	tests := []struct {
		name       string
		args       []string
		wantSource string
		wantErr    string
	}{
		{
			name:    "Missing source",
			args:    []string{"finder"},
			wantErr: "Error: source parameter is required",
		},
		{
			name:    "Invalid source",
			args:    []string{"finder", "invalid"},
			wantErr: "Error: invalid source 'invalid'. Must be one of: images, tickets, info",
		},
		{
			name:       "Valid source",
			args:       []string{"finder", "images"},
			wantSource: "images",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Args = tt.args
			source, args, err := parseArgs()

			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("parseArgs() error = %v, wantErr %v", err, tt.wantErr)
				}
			} else {
				if err != nil {
					t.Errorf("parseArgs() unexpected error: %v", err)
				}
				if source != tt.wantSource {
					t.Errorf("parseArgs() source = %v, want %v", source, tt.wantSource)
				}
				if len(args) != 0 {
					t.Errorf("parseArgs() args = %v, want empty", args)
				}
			}
		})
	}
}

func TestParseFlags_Errors(t *testing.T) {
	tests := []struct {
		name      string
		source    string
		args      []string
		wantErr   string
		wantUsage bool
	}{
		{
			name:      "Help flag",
			source:    "images",
			args:      []string{"--help"},
			wantErr:   "flag: help requested",
			wantUsage: true,
		},
		{
			name:    "Invalid flag for source",
			source:  "tickets",
			args:    []string{"--rootdir=/tmp"},
			wantErr: "Error: flag --rootdir is not valid for source 'tickets'",
		},
		{
			name:    "Unknown flag",
			source:  "info",
			args:    []string{"--unknown"},
			wantErr: "flag provided but not defined: -unknown",
		},
		{
			name:    "Internal error: invalid source passed to parseFlags",
			source:  "invalid_source",
			args:    []string{},
			wantErr: "Error: invalid source 'invalid_source'",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Capture stderr to verify usage output
			r, w, _ := os.Pipe()
			origStderr := os.Stderr
			os.Stderr = w
			defer func() { os.Stderr = origStderr }()

			_, err := parseFlags(tt.source, tt.args)

			w.Close()
			var buf bytes.Buffer
			io.Copy(&buf, r)
			output := buf.String()

			if err == nil {
				t.Errorf("parseFlags() expected error, got nil")
			} else if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("parseFlags() error = %v, want substring %v", err, tt.wantErr)
			}

			if tt.wantUsage {
				if !strings.Contains(output, "Usage:") {
					t.Errorf("Expected usage output in stderr, got: %s", output)
				}
			}
		})
	}
}

func TestFinder_Failures(t *testing.T) {
	// For failure cases that call os.Exit(1), we must run them as a subprocess.
	// These won't contribute to code coverage but verify the exit behavior.

	tests := []struct {
		name     string
		args     []string
		wantExit int
		wantOut  string
	}{
		{
			name:     "Invalid flag for tickets source",
			args:     []string{"tickets", "--rootdir=/tmp"},
			wantExit: 1,
			wantOut:  "Error: flag --rootdir is not valid for source 'tickets'",
		},
		{
			name:     "Invalid source",
			args:     []string{"invalid"},
			wantExit: 1,
			wantOut:  "Error: invalid source 'invalid'",
		},
		{
			name:     "Missing source",
			args:     []string{},
			wantExit: 1,
			wantOut:  "Error: source parameter is required",
		},
		{
			name:     "Invalid flag",
			args:     []string{"info", "--junk"},
			wantExit: 1,
			wantOut:  "flag provided but not defined: -junk",
		},
		{
			name:     "Help flag",
			args:     []string{"images", "--help"},
			wantExit: 1,
			wantOut:  "source: source of data to be used (images, tickets, info)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmdArgs := append([]string{"run", "finder.go"}, tt.args...)
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

			if !strings.Contains(output, tt.wantOut) {
				t.Errorf("Expected output to contain %q, got:\n%s", tt.wantOut, output)
			}
		})
	}
}
