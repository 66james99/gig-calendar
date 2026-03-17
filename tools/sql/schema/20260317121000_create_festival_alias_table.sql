-- +goose Up
-- Create the festival_alias table to store alternative names for festivals.
CREATE TABLE festival_alias (
    id SERIAL PRIMARY KEY,
    festival_id INTEGER NOT NULL REFERENCES festival(promoter_id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant necessary permissions to the application user for CRUD operations.
GRANT SELECT, INSERT, UPDATE, DELETE ON festival_alias TO "gc-app";

-- +goose Down
-- Remove the festival_alias table.
DROP TABLE IF EXISTS festival_alias;