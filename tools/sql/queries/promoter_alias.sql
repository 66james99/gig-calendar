-- name: ListPromoterAliases :many
SELECT id, uuid, promoter, created, updated, alias FROM promoter_alias
ORDER BY alias;

-- name: CreatePromoterAlias :one
INSERT INTO promoter_alias (promoter, alias)
VALUES ($1, $2)
RETURNING id, uuid, promoter, created, updated, alias;

-- name: GetPromoterAlias :one
SELECT id, uuid, promoter, created, updated, alias FROM promoter_alias
WHERE id = $1;

-- name: UpdatePromoterAlias :one
UPDATE promoter_alias
SET promoter = $1, alias = $2, updated = NOW()
WHERE id = $3
RETURNING id, uuid, promoter, created, updated, alias;

-- name: DeletePromoterAlias :exec
DELETE FROM promoter_alias
WHERE id = $1;