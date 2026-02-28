package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	//"net/http"
	"os"

	"strings"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

func loadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}
}

func getToken(config *oauth2.Config, tokenPath string) *oauth2.Token {
	// Try loading existing token
	f, err := os.Open(tokenPath)
	if err == nil {
		defer f.Close()
		var token oauth2.Token
		json.NewDecoder(f).Decode(&token)
		return &token
	}

	// No token → run OAuth flow
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	fmt.Println("Visit this URL and authorize the app:")
	fmt.Println(authURL)

	var code string
	fmt.Print("Enter the authorization code: ")
	fmt.Scan(&code)

	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		log.Fatalf("Token exchange error: %v", err)
	}

	// Save token
	f, err = os.Create(tokenPath)
	if err == nil {
		defer f.Close()
		json.NewEncoder(f).Encode(token)
	}

	return token
}

func main() {
	loadEnv()

	credentialsPath := os.Getenv("GMAIL_CREDENTIALS_PATH")
	if credentialsPath == "" {
		log.Fatal("GMAIL_CREDENTIALS_PATH not set in environment")
	}

	tokenPath := os.Getenv("TOKEN_PATH")
	if tokenPath == "" {
		tokenPath = "token.json"
	}

	ctx := context.Background()

	// Load OAuth client credentials
	b, err := os.ReadFile(credentialsPath)
	if err != nil {
		log.Fatalf("Unable to read credentials file: %v", err)
	}

	config, err := google.ConfigFromJSON(b, gmail.GmailReadonlyScope)
	if err != nil {
		log.Fatalf("Unable to parse client secret file: %v", err)
	}

	client := config.Client(ctx, getToken(config, tokenPath))

	// Create Gmail service
	srv, err := gmail.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		log.Fatalf("Unable to create Gmail client: %v", err)
	}

	label := "Gig Calendar/ticket"

	msgList, err := srv.Users.Messages.List("me").Q("label:\"" + label + "\"").Do()
	if err != nil {
		if strings.Contains(err.Error(), "invalid_grant") {
			log.Printf("Authentication error: The OAuth2 token is invalid or expired.")
			log.Fatalf("Please delete the token file at '%s' and run the command again to re-authenticate.", tokenPath)
		}
		log.Fatalf("Unable to retrieve messages: %v", err)
	}

	fmt.Printf("Found %d messages with label %s\n", len(msgList.Messages), label)

	for _, m := range msgList.Messages {
		msg, err := srv.Users.Messages.Get("me", m.Id).Format("metadata").Do()
		if err != nil {
			log.Printf("Error fetching message %s: %v", m.Id, err)
			continue
		}

		var subject, from string
		for _, h := range msg.Payload.Headers {
			switch h.Name {
			case "Subject":
				subject = h.Value
			case "From":
				from = h.Value
			}
		}

		fmt.Printf("ID: %s\nFrom: %s\nSubject: %s\nSnippet: %s\n\n",
			msg.Id, from, subject, msg.Snippet)
	}
}
