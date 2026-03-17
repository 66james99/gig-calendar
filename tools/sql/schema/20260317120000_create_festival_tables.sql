-- +goose Up
-- Create tables for festival management, including associations with promoters and venues.

CREATE TABLE festival (
    promoter_id integer PRIMARY KEY
        REFERENCES promoter(id)
        ON DELETE RESTRICT,
    start_date date NOT NULL,
    end_date date NOT NULL,
    website text,
    description text
);

CREATE TABLE festival_promoter (
    festival_id integer NOT NULL
        REFERENCES festival(promoter_id)
        ON DELETE CASCADE,
    promoter_id integer NOT NULL
        REFERENCES promoter(id)
        ON DELETE RESTRICT,
    role text,
    PRIMARY KEY (festival_id, promoter_id)
);

CREATE TABLE festival_venue (
    festival_id integer NOT NULL
        REFERENCES festival(promoter_id)
        ON DELETE CASCADE,
    venue_id integer NOT NULL
        REFERENCES venue(id)
        ON DELETE RESTRICT,
    stage_order integer,
    is_primary boolean DEFAULT false,
    PRIMARY KEY (festival_id, venue_id)
);

-- Grant necessary permissions to the application user for CRUD operations.
GRANT SELECT, INSERT, UPDATE, DELETE ON festival, festival_promoter, festival_venue TO "gc-app";

-- +goose Down
-- Remove the festival-related tables in reverse order of creation to respect foreign key constraints.
DROP TABLE IF EXISTS festival_venue;
DROP TABLE IF EXISTS festival_promoter;
DROP TABLE IF EXISTS festival;