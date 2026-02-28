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
			args:       []string{"finder", "--rootdir=/tmp", "--pattern=*.jpg", "--date_from_exif", "--dryrun", "images"},
			wantOutput: "Source: images\nDryrun: true\nDateFromExif: true\nRootDir: /tmp\nPattern: *.jpg\n",
		},
		{
			name:       "Valid tickets source with allowed flag",
			args:       []string{"finder", "--dryrun", "tickets"},
			wantOutput: "Source: tickets\nDryrun: true\n",
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
			args:     []string{"--rootdir=/tmp", "tickets"},
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
