package metadata

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
