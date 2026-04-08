# gig-calendar

An application for tracking live music events, managing tickets, and ingesting gig information from various sources.

## Sources of Information

### Image Library
I have an extensive library of photographs captured at live music events, stored in various directory structures capturing different metadata about the events.

### Email Ingestion
Uses a local LLM to extract gig information from:
* Ticket Emails
* Email lists of upcoming events from promoters, venues and bands

## Technical Stack

The application is built using a modern decoupled architecture:

- **Backend:** Written in **Go**, utilizing a **PostgreSQL** database managed with `goose` migrations and `sqlc` for type-safe queries.
- **Frontend:** Admin and Public sites are developed as Single Page Applications (SPAs) using **TypeScript**, **React**, and **TanStack** (Table & Query) frameworks.
- **AI Integration:** Significant portions of the logic utilize local LLMs for data extraction and were developed with the assistance of GitHub Copilot and Gemini.

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
* **Mac Mini Pro:** Dedicated to running local LLMs for ingestion tasks.
* **Synology NAS:** Stores the primary image library and metadata.
* **Windows 11:** Primary development environment using VS Code.

## Development

### Prerequisites
- Go 1.21+
- Node.js & npm
- PostgreSQL
- `goose` (for database migrations)

### Running the Application
1. **Database:** Apply migrations using `tools/helpers/goose`.
2. **Backend:** Run the webserver from `tools/webserver`.
3. **Frontend:** Build/serve the SPAs from `tools/content`.

## License
MIT
