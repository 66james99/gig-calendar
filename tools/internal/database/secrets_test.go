package database

import (
	"context"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	"google.golang.org/api/option"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// fakeSecretManagerServer implements the SecretManagerServiceServer interface
// to handle gRPC requests locally.
type fakeSecretManagerServer struct {
	secretmanagerpb.UnimplementedSecretManagerServiceServer
	secrets map[string]string
}

func (s *fakeSecretManagerServer) AccessSecretVersion(ctx context.Context, req *secretmanagerpb.AccessSecretVersionRequest) (*secretmanagerpb.AccessSecretVersionResponse, error) {
	val, ok := s.secrets[req.Name]
	if !ok {
		return nil, fmt.Errorf("secret not found: %s", req.Name)
	}
	return &secretmanagerpb.AccessSecretVersionResponse{
		Payload: &secretmanagerpb.SecretPayload{
			Data: []byte(val),
		},
	}, nil
}

func TestGetSecret(t *testing.T) {
	// 1. Start a Fake gRPC Server
	listener, err := net.Listen("tcp", "localhost:0")
	if err != nil {
		t.Fatalf("failed to listen: %v", err)
	}
	grpcServer := grpc.NewServer()
	fakeServer := &fakeSecretManagerServer{
		secrets: map[string]string{
			"projects/my-project/secrets/my-secret/versions/1": "super-secret-value",
		},
	}
	secretmanagerpb.RegisterSecretManagerServiceServer(grpcServer, fakeServer)
	go grpcServer.Serve(listener)
	defer grpcServer.Stop()

	// 2. Create a dummy credentials file.
	// GetSecret requires this file to exist, but since we are injecting a connection,
	// the actual content won't be used for auth, though it must be valid JSON to pass basic checks.
	tempDir := t.TempDir()
	credsPath := filepath.Join(tempDir, "creds.json")
	if err := os.WriteFile(credsPath, []byte(`{"type": "service_account"}`), 0644); err != nil {
		t.Fatalf("failed to write dummy creds: %v", err)
	}

	// 3. Dial the fake server
	conn, err := grpc.NewClient(listener.Addr().String(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()

	tests := []struct {
		name       string
		secretName string
		want       string
		wantErrStr string
	}{
		{
			name:       "secret found",
			secretName: "projects/my-project/secrets/my-secret/versions/1",
			want:       "super-secret-value",
		},
		{
			name:       "secret does not exist",
			secretName: "projects/my-project/secrets/non-existent-secret/versions/1",
			wantErrStr: "failed to access secret version",
		},
		{
			name:       "secret version does not exist",
			secretName: "projects/my-project/secrets/my-secret/versions/latest",
			wantErrStr: "failed to access secret version",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Call GetSecret injecting the connection to our fake server
			got, err := GetSecret(tt.secretName, credsPath, option.WithGRPCConn(conn))

			if tt.wantErrStr != "" {
				if err == nil {
					t.Fatalf("GetSecret() expected error, got nil")
				}
				if !strings.Contains(err.Error(), tt.wantErrStr) {
					t.Errorf("GetSecret() error = %q, want to contain %q", err.Error(), tt.wantErrStr)
				}
				return
			}

			if err != nil {
				t.Fatalf("GetSecret() returned unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("GetSecret() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestGetSecret_InvalidCredentials(t *testing.T) {
	t.Run("credentials file is not valid json", func(t *testing.T) {
		tempDir := t.TempDir()
		credsPath := filepath.Join(tempDir, "creds.json")
		if err := os.WriteFile(credsPath, []byte("{not-json}"), 0644); err != nil {
			t.Fatalf("failed to write dummy creds: %v", err)
		}

		_, err := GetSecret("any-secret", credsPath)
		if err == nil {
			t.Fatal("GetSecret() expected error for invalid JSON, got nil")
		}

		// The underlying google auth lib should fail to parse the credentials.
		// We check for our wrapper error message.
		if !strings.Contains(err.Error(), "failed to create secretmanager client") {
			t.Errorf("GetSecret() error = %q, want to contain %q", err.Error(), "failed to create secretmanager client")
		}
	})

	t.Run("credentials file not found", func(t *testing.T) {
		tempDir := t.TempDir()
		credsPath := filepath.Join(tempDir, "non-existent-creds.json")

		_, err := GetSecret("any-secret", credsPath)
		if err == nil {
			t.Fatal("GetSecret() expected error for non-existent file, got nil")
		}

		if !strings.Contains(err.Error(), "failed to read credentials file") {
			t.Errorf("GetSecret() error = %q, want to contain %q", err.Error(), "failed to read credentials file")
		}
	})
}
