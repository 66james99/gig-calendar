package metadata

import (
	"github.com/66james99/gig-calendar/internal/database"
	"github.com/66james99/gig-calendar/internal/dbcollection"
)

type BaseConfig struct {
	Source  string
	DryRun  bool
	Verbose bool
	Debug   bool
}

type TicketsConfig struct {
	BaseConfig
}

type InfoConfig struct {
	BaseConfig
}

type ImagesConfig struct {
	BaseConfig
	DateFromExif  bool
	RootDir       string
	Pattern       string // The pattern of tokens to be matching in the directory path
	IncludeParent bool
	IgnoreDirs    []string
	Queries       *database.Queries
	Patterns      *dbcollection.DBArray[string] // An array of patterns to be used to seperate performers when there are more than one in a single slot
}
