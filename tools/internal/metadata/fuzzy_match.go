package metadata

import (
	"strings"
	"unicode"
)

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

// SplitFuzzy splits a string s by a separator sep, allowing for fuzzy matching.
// It respects word boundaries for alphanumeric separators.
func SplitFuzzy(s, sep string) []string {
	if sep == "" {
		return []string{s}
	}

	sepPrepared := PrepareForFuzzy(sep)
	sepPreparedRunes := []rune(sepPrepared)
	sepPreparedLen := len(sepPreparedRunes)

	threshold := 2
	if sepPreparedLen <= 5 {
		threshold = 1
	}

	sRunes := []rune(s)
	n := len(sRunes)

	checkLeftBoundary := false
	if sepPreparedLen > 0 && (unicode.IsLetter(sepPreparedRunes[0]) || unicode.IsDigit(sepPreparedRunes[0])) {
		checkLeftBoundary = true
	}
	checkRightBoundary := false
	if sepPreparedLen > 0 && (unicode.IsLetter(sepPreparedRunes[sepPreparedLen-1]) || unicode.IsDigit(sepPreparedRunes[sepPreparedLen-1])) {
		checkRightBoundary = true
	}

	var parts []string
	lastIdx := 0
	i := 0
	for i < n {
		bestDist := threshold + 1
		bestLen := -1

		minLen := 1
		maxLen := sepPreparedLen + threshold
		if maxLen > n-i {
			maxLen = n - i
		}

		for l := minLen; l <= maxLen; l++ {
			candidateRaw := string(sRunes[i : i+l])
			candidatePrepared := PrepareForFuzzy(candidateRaw)
			dist := Levenshtein(candidatePrepared, sepPrepared)

			if dist <= threshold {
				valid := true
				if checkLeftBoundary && i > 0 {
					prev := sRunes[i-1]
					if unicode.IsLetter(prev) || unicode.IsDigit(prev) {
						valid = false
					}
				}
				if valid && checkRightBoundary && i+l < n {
					next := sRunes[i+l]
					if unicode.IsLetter(next) || unicode.IsDigit(next) {
						valid = false
					}
				}
				// Prevent splitting strictly between two alphanumeric characters (mid-word)
				if valid && i > 0 {
					if (unicode.IsLetter(sRunes[i]) || unicode.IsDigit(sRunes[i])) &&
						(unicode.IsLetter(sRunes[i-1]) || unicode.IsDigit(sRunes[i-1])) {
						valid = false
					}
				}
				// If separator starts with a non-alphanumeric character (e.g. space),
				// the match should not start with an alphanumeric character.
				if valid && sepPreparedLen > 0 && !(unicode.IsLetter(sepPreparedRunes[0]) || unicode.IsDigit(sepPreparedRunes[0])) {
					firstRune := []rune(candidateRaw)[0]
					if unicode.IsLetter(firstRune) || unicode.IsDigit(firstRune) {
						valid = false
					}
				}

				if valid {
					if dist < bestDist {
						bestDist = dist
						bestLen = l
					}
				}
			}
		}

		if bestLen != -1 {
			parts = append(parts, string(sRunes[lastIdx:i]))
			lastIdx = i + bestLen
			i += bestLen
		} else {
			i++
		}
	}
	parts = append(parts, string(sRunes[lastIdx:]))
	return parts
}
