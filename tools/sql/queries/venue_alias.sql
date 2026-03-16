-- name: ListVenueAliases :many
SELECT id, venue, created, updated, alias FROM venue_alias
ORDER BY alias;

-- name: CreateVenueAlias :one
INSERT INTO venue_alias (venue, alias)
VALUES ($1, $2)
RETURNING id, venue, created, updated, alias;

-- name: GetVenueAlias :one
SELECT id, venue, created, updated, alias FROM venue_alias
WHERE id = $1;

-- name: UpdateVenueAlias :one
UPDATE venue_alias
SET venue = $1, alias = $2, updated = NOW()
WHERE id = $3
RETURNING id, venue, created, updated, alias;

-- name: DeleteVenueAlias :exec
DELETE FROM venue_alias
WHERE id = $1;