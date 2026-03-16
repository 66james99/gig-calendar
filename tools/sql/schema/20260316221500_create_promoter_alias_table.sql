-- +goose Up
-- Create the promoter_alias table to store alternative names for promoters.
CREATE TABLE promoter_alias (
    id SERIAL PRIMARY KEY,
    promoter INTEGER NOT NULL REFERENCES promoter(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant necessary permissions to the application user for CRUD operations.
GRANT SELECT, INSERT, UPDATE, DELETE ON promoter_alias TO "gc-app";

-- +goose Down
-- Remove the promoter_alias table.
DROP TABLE promoter_alias;