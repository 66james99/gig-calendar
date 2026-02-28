package images

import (
	"reflect"
	"testing"
)

func TestValidatePattern(t *testing.T) {
	tests := []struct {
		name    string
		pattern string
		wantErr bool
		errStr  string
	}{
		{
			name:    "Valid pattern",
			pattern: "%y/%m - %M %y/%d - %P (%V) %p",
			wantErr: false,
		},
		{
			name:    "Empty pattern is valid",
			pattern: "",
			wantErr: false,
		},
		{
			name:    "Consecutive placeholders",
			pattern: "%y%m",
			wantErr: true,
			errStr:  "invalid pattern: placeholders must be separated",
		},
		{
			name:    "Unknown placeholder",
			pattern: "%y/%z",
			wantErr: true,
			errStr:  "invalid pattern: unknown placeholder '%z'",
		},
		{
			name:    "Trailing percent",
			pattern: "%y/%",
			wantErr: true,
			errStr:  "invalid pattern: trailing '%'",
		},
		{
			name:    "Valid simple pattern",
			pattern: "%P (%V)",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePattern(tt.pattern)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePattern() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && err.Error() != tt.errStr {
				t.Errorf("ValidatePattern() error string = %q, want %q", err.Error(), tt.errStr)
			}
		})
	}
}

func TestParseLocation(t *testing.T) {
	tests := []struct {
		name     string
		pattern  string
		location string
		want     LocationData
		wantErr  bool
	}{
		{
			name:     "Full match",
			pattern:  "%y/%m - %M %y/%d - %P (%V) %p",
			location: "2024/01 - January 2024/24 - Performer1, Performer2 (Venue Name) Promoter1, Promoter2",
			want: LocationData{
				Year:       2024,
				Month:      1,
				Day:        24,
				MonthName:  "January",
				Performers: []string{"Performer1", "Performer2"},
				Venue:      "Venue Name",
				Promoters:  []string{"Promoter1", "Promoter2"},
				Consistent: true,
			},
			wantErr: false,
		},
		{
			name:     "Missing promoter (optional)",
			pattern:  "%y/%m - %M %y/%d - %P (%V) %p",
			location: "2024/01 - January 2024/24 - Liv Austin, Charllote Campbell, Beth Keeping (Bar Topolski)",
			want: LocationData{
				Year:       2024,
				Month:      1,
				Day:        24,
				MonthName:  "January",
				Performers: []string{"Liv Austin", "Charllote Campbell", "Beth Keeping"},
				Venue:      "Bar Topolski",
				Promoters:  nil,
				Consistent: true,
			},
			wantErr: false,
		},
		{
			name:     "Simple pattern missing optional end",
			pattern:  "%P %V %p",
			location: "Perf Venue",
			want: LocationData{
				Performers: []string{"Perf"},
				Venue:      "Venue",
				Promoters:  nil,
				Consistent: true,
			},
			wantErr: false,
		},
		{
			name:     "Inconsistent year",
			pattern:  "%y/%m - %M %y/%d",
			location: "2023/01 - January 2024/24",
			want: LocationData{
				Year:       2024, // Last one wins
				Month:      1,
				Day:        24,
				MonthName:  "January",
				Performers: nil,
				Venue:      "",
				Promoters:  nil,
				Consistent: false, // Because year is different
			},
			wantErr: false,
		},
		{
			name:     "Invalid MonthName",
			pattern:  "%M",
			location: "NotAMonth",
			want: LocationData{
				MonthName:  "NotAMonth",
				Consistent: false,
			},
			wantErr: false,
		},
		{
			name:     "Consistent MonthName and Month",
			pattern:  "%M %m",
			location: "March 03",
			want: LocationData{
				MonthName:  "March",
				Month:      3,
				Consistent: true,
			},
			wantErr: false,
		},
		{
			name:     "Inconsistent MonthName and Month",
			pattern:  "%M %m",
			location: "March 04",
			want: LocationData{
				MonthName:  "March",
				Month:      4,
				Consistent: false,
			},
			wantErr: false,
		},
		{
			name:     "Case insensitive MonthName",
			pattern:  "%M %m",
			location: "march 03",
			want: LocationData{
				MonthName:  "march",
				Month:      3,
				Consistent: true,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseLocation(tt.pattern, tt.location)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseLocation() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ParseLocation() = %+v, want %+v", got, tt.want)
			}
		})
	}
}
