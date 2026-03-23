package dbcollection

// Key restricts the types that can be used as keys in DBMap.
// PostgreSQL types that map to Go slices (e.g., bytea, json, jsonb, arrays)
// are not comparable and therefore cannot be used as keys.
type Key interface {
	comparable
}

// Value represents any type that can be stored in DBMap or DBArray.
type Value interface {
	any
}
