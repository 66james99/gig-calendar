-- +goose Up
-- Add directory column to source_image table.
-- We set a default of empty string to satisfy the NOT NULL constraint for existing rows.
ALTER TABLE source_image ADD COLUMN directory TEXT NOT NULL DEFAULT '';

-- +goose Down
-- Remove directory column from source_image table.
ALTER TABLE source_image DROP COLUMN directory;