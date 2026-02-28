package images

import (
	"fmt"
	"strconv"
	"strings"
)

// LocationData holds the metadata extracted from a location string.
type LocationData struct {
	Year       int
	Month      int
	Day        int
	MonthName  string
	Performers []string
	Venue      string
	Promoters  []string
}

// ParseLocation parses a location string based on the provided pattern.
// Supported placeholders:
// %y: numeric year
// %m: numeric month
// %d: numeric day of the month
// %M: names of the months of the year
// %P: comma separated list of performers names
// %V: venue name (cannot contain '(' or ')')
// %p: comma separated list of promoters names
func ParseLocation(pattern, location string) (LocationData, error) {
	type token struct {
		isPlaceholder bool
		value         string
	}

	// 1. Tokenize the pattern into placeholders and literals
	var tokens []token
	lastIdx := 0
	for i := 0; i < len(pattern); {
		if pattern[i] == '%' {
			if i > lastIdx {
				tokens = append(tokens, token{isPlaceholder: false, value: pattern[lastIdx:i]})
			}
			if i+1 >= len(pattern) {
				return LocationData{}, fmt.Errorf("invalid pattern: trailing '%%'")
			}
			tokens = append(tokens, token{isPlaceholder: true, value: pattern[i : i+2]})
			i += 2
			lastIdx = i
		} else {
			i++
		}
	}
	if lastIdx < len(pattern) {
		tokens = append(tokens, token{isPlaceholder: false, value: pattern[lastIdx:]})
	}

	// 2. Parse the location string using the tokens
	var capturedValues [][2]string // Stores [placeholder, value]
	remainingLocation := location

	for i, tok := range tokens {
		if !tok.isPlaceholder {
			// Consume literal from the location string
			if !strings.HasPrefix(remainingLocation, tok.value) {
				// This could be a separator for optional fields at the end.
				allSubsequentArePlaceholders := true
				if i+1 >= len(tokens) {
					allSubsequentArePlaceholders = false // Not a separator, it's the last token.
				} else {
					for j := i + 1; j < len(tokens); j++ {
						if !tokens[j].isPlaceholder {
							allSubsequentArePlaceholders = false
							break
						}
					}
				}

				// If all subsequent tokens are placeholders and we've consumed the whole location string,
				// assume the optional parts are missing.
				if allSubsequentArePlaceholders && (remainingLocation == "" || strings.HasPrefix(tok.value, remainingLocation)) {
					// Add empty captures for the remaining optional placeholders and finish parsing.
					remainingLocation = ""
					for j := i + 1; j < len(tokens); j++ {
						capturedValues = append(capturedValues, [2]string{tokens[j].value, ""})
					}
					break // Terminate the loop.
				}
				return LocationData{}, fmt.Errorf("location does not match pattern: expected literal '%s' but not found in remaining string '%s'", tok.value, remainingLocation)
			}
			remainingLocation = remainingLocation[len(tok.value):]
			continue
		}

		// Find the next literal to know where this placeholder's value ends
		nextLiteral := ""
		nextLiteralIdx := -1
		for j := i + 1; j < len(tokens); j++ {
			if !tokens[j].isPlaceholder {
				nextLiteral = tokens[j].value
				nextLiteralIdx = j
				break
			}
		}

		var value string
		if nextLiteral == "" {
			// This is the last token, so it consumes the rest of the string
			value = remainingLocation
			remainingLocation = ""
		} else {
			splitIndex := -1
			// Use a heuristic for greedy vs. non-greedy placeholders
			isGreedy := tok.value == "%P" || tok.value == "%p"
			if isGreedy {
				splitIndex = strings.LastIndex(remainingLocation, nextLiteral)
			} else {
				splitIndex = strings.Index(remainingLocation, nextLiteral)
			}

			if splitIndex == -1 {
				// Try to match a prefix of nextLiteral at the end of remainingLocation
				for k := len(nextLiteral) - 1; k > 0; k-- {
					if strings.HasSuffix(remainingLocation, nextLiteral[:k]) {
						splitIndex = len(remainingLocation) - k
						break
					}
				}
			}

			if splitIndex == -1 {
				// If the separator is missing, check if the rest of the pattern is optional.
				if nextLiteralIdx != -1 {
					allSubsequentArePlaceholders := true
					for k := nextLiteralIdx + 1; k < len(tokens); k++ {
						if !tokens[k].isPlaceholder {
							allSubsequentArePlaceholders = false
							break
						}
					}
					if allSubsequentArePlaceholders {
						splitIndex = len(remainingLocation)
					}
				}
			}

			if splitIndex == -1 {
				return LocationData{}, fmt.Errorf("location does not match pattern: could not find separator '%s' for placeholder '%s'", nextLiteral, tok.value)
			}
			value = remainingLocation[:splitIndex]
			remainingLocation = remainingLocation[splitIndex:]
		}
		capturedValues = append(capturedValues, [2]string{tok.value, value})
	}

	if remainingLocation != "" {
		return LocationData{}, fmt.Errorf("location has trailing characters not matched by pattern: '%s'", remainingLocation)
	}

	// 3. Populate the LocationData struct from the captured values
	var data LocationData
	for _, captured := range capturedValues {
		placeholder, val := captured[0], captured[1]
		switch placeholder {
		case "%y":
			data.Year, _ = strconv.Atoi(val)
		case "%m":
			data.Month, _ = strconv.Atoi(val)
		case "%d":
			data.Day, _ = strconv.Atoi(val)
		case "%M":
			data.MonthName = val
		case "%V":
			data.Venue = strings.TrimSpace(val)
		case "%P":
			if val == "" {
				continue
			}
			parts := strings.Split(val, ",")
			for _, p := range parts {
				data.Performers = append(data.Performers, strings.TrimSpace(p))
			}
		case "%p":
			if val == "" {
				continue
			}
			parts := strings.Split(val, ",")
			for _, p := range parts {
				data.Promoters = append(data.Promoters, strings.TrimSpace(p))
			}
		}
	}

	return data, nil
}
