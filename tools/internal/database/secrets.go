package database

import (
	"context"
	"fmt"
	"os"

	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	"cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	"google.golang.org/api/option"
)

// GetSecret fetches a secret from Google Cloud Secret Manager.
// The name should be in the format `projects/*/secrets/*/versions/*`.
func GetSecret(name string, credentialsPath string, opts ...option.ClientOption) (string, error) {
	ctx := context.Background()

	jsonCredentials, err := os.ReadFile(credentialsPath)
	if err != nil {
		return "", fmt.Errorf("failed to read credentials file: %w", err)
	}

	clientOpts := []option.ClientOption{option.WithAuthCredentialsJSON(option.ServiceAccount, jsonCredentials)}
	clientOpts = append(clientOpts, opts...)
	client, err := secretmanager.NewClient(ctx, clientOpts...)
	if err != nil {
		return "", fmt.Errorf("failed to create secretmanager client: %w", err)
	}
	defer client.Close()

	req := &secretmanagerpb.AccessSecretVersionRequest{
		Name: name,
	}

	result, err := client.AccessSecretVersion(ctx, req)
	if err != nil {
		return "", fmt.Errorf("failed to access secret version: %w", err)
	}

	return string(result.Payload.Data), nil
}
