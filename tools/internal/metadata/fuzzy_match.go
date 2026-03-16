package metadata

import "strings"

// PrepareForFuzzy normalizes a string for fuzzy matching (lowercase, replacements).
func PrepareForFuzzy(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, "&", "and")
	s = strings.ReplaceAll(s, "@", "at")
	return s
}

// IsFuzzyMatch determines if two strings are similar enough to be considered a match.
func IsFuzzyMatch(s1, s2 string) bool {
	d := Levenshtein(PrepareForFuzzy(s1), PrepareForFuzzy(s2))
	if d == 0 {
		return true
	}

	maxLen := len(s1)
	if len(s2) > maxLen {
		maxLen = len(s2)
	}

	// Allow 1 edit for short strings (<= 5 chars), 2 edits for longer ones.
	if maxLen <= 5 {
		return d <= 1
	}
	return d <= 2
}

// Levenshtein calculates the Levenshtein distance between two strings.
func Levenshtein(s1, s2 string) int {
	r1, r2 := []rune(s1), []rune(s2)
	n, m := len(r1), len(r2)
	if n == 0 {
		return m
	}
	if m == 0 {
		return n
	}
	matrix := make([][]int, n+1)
	for i := range matrix {
		matrix[i] = make([]int, m+1)
		matrix[i][0] = i
	}
	for j := 0; j <= m; j++ {
		matrix[0][j] = j
	}
	for i := 1; i <= n; i++ {
		for j := 1; j <= m; j++ {
			cost := 0
			if r1[i-1] != r2[j-1] {
				cost = 1
			}
			val1 := matrix[i-1][j] + 1
			val2 := matrix[i][j-1] + 1
			val3 := matrix[i-1][j-1] + cost

			minVal := val1
			if val2 < minVal {
				minVal = val2
			}
			if val3 < minVal {
				minVal = val3
			}
			matrix[i][j] = minVal
		}
	}
	return matrix[n][m]
}
