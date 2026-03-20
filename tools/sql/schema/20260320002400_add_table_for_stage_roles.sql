-- +goose Up
-- Add table to hold list of patterns to be used when extracting performers from the description of those on stage
CREATE TABLE IF NOT EXISTS public.stage_role
(
    id serial NOT NULL,
    uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    pattern text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (uuid),
    UNIQUE (pattern)
);

-- Grant necessary permissions to the application user for CRUD operations.
GRANT SELECT, INSERT, UPDATE, DELETE ON festival_alias TO "gc-app";

-- +goose Down
-- Remove the festival_alias table.
DROP TABLE IF EXISTS stage_role;
