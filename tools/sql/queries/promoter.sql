-- name: ListPromoters :many
SELECT id, uuid, created, updated, name FROM promoter
ORDER BY name;

-- name: CreatePromoter :one
INSERT INTO promoter (name)
VALUES ($1)
RETURNING id, uuid, created, updated, name;

-- name: GetPromoter :one
SELECT id, uuid, created, updated, name FROM promoter
WHERE id = $1;

-- name: UpdatePromoter :one
UPDATE promoter
SET name = $1, updated = NOW()
WHERE id = $2
RETURNING id, uuid, created, updated, name;

-- name: DeletePromoter :exec
DELETE FROM promoter
WHERE id = $1;