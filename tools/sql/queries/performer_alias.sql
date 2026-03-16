-- name: ListPerformerAliases :many
SELECT id, uuid, performer, created, updated, alias FROM performer_alias
ORDER BY alias;

-- name: CreatePerformerAlias :one
INSERT INTO performer_alias (performer, alias)
VALUES ($1, $2)
RETURNING id, uuid, performer, created, updated, alias;

-- name: GetPerformerAlias :one
SELECT id, uuid, performer, created, updated, alias FROM performer_alias
WHERE id = $1;

-- name: UpdatePerformerAlias :one
UPDATE performer_alias
SET performer = $1, alias = $2, updated = NOW()
WHERE id = $3
RETURNING id, uuid, performer, created, updated, alias;

-- name: DeletePerformerAlias :exec
DELETE FROM performer_alias
WHERE id = $1;