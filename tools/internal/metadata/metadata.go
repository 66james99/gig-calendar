package metadata

type BaseConfig struct {
	Source string
	DryRun bool
}

type TicketsConfig struct {
	BaseConfig
}

type InfoConfig struct {
	BaseConfig
}
