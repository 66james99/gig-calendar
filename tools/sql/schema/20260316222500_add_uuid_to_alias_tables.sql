-- +goose Up
-- Add a UUID column to alias tables for stable, unique identification across the system.
-- This ensures that even if an alias name changes, its unique identifier remains constant.

-- +goose StatementBegin
ALTER TABLE promoter_alias ADD COLUMN uuid UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE promoter_alias ADD CONSTRAINT uq_promoter_alias_uuid UNIQUE (uuid);

ALTER TABLE performer_alias ADD COLUMN uuid UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE performer_alias ADD CONSTRAINT uq_performer_alias_uuid UNIQUE (uuid);

ALTER TABLE venue_alias ADD COLUMN uuid UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE venue_alias ADD CONSTRAINT uq_venue_alias_uuid UNIQUE (uuid);
-- +goose StatementEnd

-- +goose Down
-- Remove the UUID column and its associated unique constraint from the alias tables.

-- +goose StatementBegin
ALTER TABLE promoter_alias DROP CONSTRAINT uq_promoter_alias_uuid;
ALTER TABLE promoter_alias DROP COLUMN uuid;

ALTER TABLE performer_alias DROP CONSTRAINT uq_performer_alias_uuid;
ALTER TABLE performer_alias DROP COLUMN uuid;

ALTER TABLE venue_alias DROP CONSTRAINT uq_venue_alias_uuid;
ALTER TABLE venue_alias DROP COLUMN uuid;
-- +goose StatementEnd