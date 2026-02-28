package images

import (
	"reflect"
	"testing"
)

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
