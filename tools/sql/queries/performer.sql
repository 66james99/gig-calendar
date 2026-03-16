-- name: ListPerformers :many
SELECT id, uuid, created, updated, name FROM performer
ORDER BY name;

-- name: CreatePerformer :one
INSERT INTO performer (name)
VALUES ($1)
RETURNING id, uuid, created, updated, name;

-- name: GetPerformer :one
SELECT id, uuid, created, updated, name FROM performer
WHERE id = $1;

-- name: UpdatePerformer :one
UPDATE performer
SET name = $1, updated = NOW()
WHERE id = $2
RETURNING id, uuid, created, updated, name;

-- name: DeletePerformer :exec
DELETE FROM performer
WHERE id = $1;