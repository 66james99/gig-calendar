package metadata

import "strings"

// Normalize removes leading/trailing whitespace and replaces multiple spaces with a single space.
func Normalize(s string) string {
	return strings.Join(strings.Fields(s), " ")
}
