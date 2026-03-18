-- +goose Up
-- Rename columns in festival_venue table
ALTER TABLE festival_venue RENAME COLUMN festival_id TO festival;
ALTER TABLE festival_venue RENAME COLUMN venue_id TO venue;

-- Rename column in festival table
ALTER TABLE festival RENAME COLUMN promoter_id TO promoter;

-- Rename column in festival_alias table
ALTER TABLE festival_alias RENAME COLUMN festival_id TO festival;

-- Rename columns in festival_promoter table
ALTER TABLE festival_promoter RENAME COLUMN festival_id TO festival;
ALTER TABLE festival_promoter RENAME COLUMN promoter_id TO promoter;

-- +goose Down
ALTER TABLE festival_venue RENAME COLUMN festival TO festival_id;
ALTER TABLE festival_venue RENAME COLUMN venue TO venue_id;
ALTER TABLE festival RENAME COLUMN promoter TO promoter_id;
ALTER TABLE festival_alias RENAME COLUMN festival TO festival_id;
ALTER TABLE festival_promoter RENAME COLUMN festival TO festival_id;
ALTER TABLE festival_promoter RENAME COLUMN promoter TO promoter_id;