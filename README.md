# gig-calendar

An application for tracking live music events, managing tickets, and ingesting gig information from various sources.

## Sources of Information

### Image Library

I have an extensive library of photographs captured at live music events, stored in various directory structures capturing different metadata about the events.

The tool uses directory names to extract information about the gigs the imaages where captured at to create event entries within the database.

### Email Ingestion

Uses a local LLM to extract gig information from:

* Ticket Emails
* Email lists of upcoming events from promoters, venues and bands

## Technical Stack

The application is built using a modern decoupled architecture:

* **Backend:** Written in **Go**, utilizing a **PostgreSQL** database managed with `goose` migrations and `sqlc` for type-safe queries.
* **Frontend:** Admin and Public sites are developed as Single Page Applications (SPAs) using **TypeScript**, **React**, and **TanStack** (Table & Query) frameworks.
* **AI Integration:** Use of local LLMs for data extraction.

## Project Structure

* `/docs/content`: Contains the static content and hosted HTML for the `admin` and `www` websites.
* `/tools/cmds`: Utility commands (e.g., `email-fetcher`, `finder`).
* `/tools/content`: Source code for the TypeScript/React SPAs.
* `/tools/internal`: Shared Go modules (API handlers, database logic, metadata processing).
* `/tools/webserver`: The Go web server implementations.

## Platforms

The project is designed to run across a distributed home lab environment:

* **Raspberry Pi:** Hosts the Go web server.
* **Orico CF1000:** Hosts the PostgreSQL database.
* **Mac Mini Pro:** Used to host local LLMs for ingestion tasks.
* **Synology NAS:** Stores the primary image library.
* **Windows 11:** Primary development environment using VS Code.

## Development

### Tools

* Go
* Node.js & npm
* PostgreSQL
* goose (for database migrations)
* sqlc (for generation of type-safe queries)
* Google Credential Vault
* VScode
