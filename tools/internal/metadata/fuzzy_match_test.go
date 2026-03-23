package metadata

import (
	"reflect"
	"testing"
)

func TestSplitFuzzy(t *testing.T) {
	tests := []struct {
		name string
		s    string
		sep  string
		want []string
	}{
		{
			name: "Exact separator match",
			s:    "Alice and Bob",
			sep:  " and ",
			want: []string{"Alice", "Bob"},
		},
		{
			name: "Separator at end",
			s:    "Alice and",
			sep:  " and",
			want: []string{"Alice", ""},
		},
		{
			name: "Empty string",
			s:    "",
			sep:  " and ",
			want: []string{""},
		},
		{
			name: "Fuzzy: wth -> with",
			s:    "Alice wth Bob",
			sep:  " with ",
			want: []string{"Alice", "Bob"},
		},
		{
			name: "Fuzzy: & -> and",
			s:    "Alice & Bob",
			sep:  " and ",
			want: []string{"Alice", "Bob"},
		},
		{
			name: "Fuzzy: and -> &",
			s:    "Alice and Bob",
			sep:  " & ",
			want: []string{"Alice", "Bob"},
		},
		{
			name: "Fuzzy: typo in long separator",
			s:    "Alice in converstation with Bob",
			sep:  " in conversation with ",
			want: []string{"Alice", "Bob"},
		},
		{
			name: "Word boundary: 'and' inside word",
			s:    "Leoni Jane Kennedy",
			sep:  "and", // Explicitly "and" without spaces to test boundary logic
			want: []string{"Leoni Jane Kennedy"},
		},
		{
			name: "Word boundary: 'and' as word",
			s:    "Alice and Bob",
			sep:  "and",
			want: []string{"Alice ", " Bob"}, // Splits around "and"
		},
		{
			name: "Word boundary: ' and ' with spaces in sep",
			s:    "Leoni Jane Kennedy",
			sep:  " and ",
			want: []string{"Leoni Jane Kennedy"},
		},
		{
			name: "Recursive/Multiple splits",
			s:    "Alpha and Beta and Charlie",
			sep:  " and ",
			want: []string{"Alpha", "Beta", "Charlie"},
		},
		{
			name: "Recursive/Multiple splits - single letter test",
			s:    "A and Beta and Charlie",
			sep:  " and ",
			want: []string{"A", "Beta", "Charlie"},
		},
		{
			name: "Recursive/Multiple splits - single letter test",
			s:    "A and B and C",
			sep:  " and ",
			want: []string{"A", "B", "C"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := SplitFuzzy(tt.s, tt.sep)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("SplitFuzzy(%q, %q) = %v, want %v", tt.s, tt.sep, got, tt.want)
			}
		})
	}
}
