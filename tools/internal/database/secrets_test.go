package database

import (
	"context"
	"fmt"
	"net"
	"os"
	"path/filepath"
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
	conn, err := grpc.Dial(listener.Addr().String(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()

	// 4. Call GetSecret injecting the connection to our fake server
	secretName := "projects/my-project/secrets/my-secret/versions/1"
	got, err := GetSecret(secretName, credsPath, option.WithGRPCConn(conn))
	if err != nil {
		t.Fatalf("GetSecret failed: %v", err)
	}

	if got != "super-secret-value" {
		t.Errorf("GetSecret = %q, want %q", got, "super-secret-value")
	}
}
