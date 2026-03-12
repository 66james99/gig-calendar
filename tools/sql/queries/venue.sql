-- name: CreateVenue :one
INSERT INTO venue (
    name
) VALUES (
    $1
) RETURNING *;

-- name: GetVenue :one
SELECT * FROM venue
WHERE id = $1 LIMIT 1;

-- name: ListVenues :many
SELECT * FROM venue
ORDER BY name;

-- name: UpdateVenue :one
UPDATE venue
SET
    name = $2,
    updated = now()
WHERE id = $1
RETURNING *;

-- name: DeleteVenue :exec
DELETE FROM venue
WHERE id = $1;