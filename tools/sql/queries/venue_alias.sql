-- name: ListVenueAliases :many
SELECT id, venue, created, updated, alias FROM venue_alias
ORDER BY alias;