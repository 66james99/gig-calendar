-- +goose Up
ALTER TABLE stage_role ADD COLUMN created TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE stage_role ADD COLUMN updated TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- +goose Down
ALTER TABLE stage_role DROP COLUMN created;
ALTER TABLE stage_role DROP COLUMN updated;