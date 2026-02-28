package images

import (
	"fmt"

	"github.com/66james99/gig-calendar/internal/metadata"
)

type ImagesConfig struct {
	metadata.BaseConfig
	DateFromExif bool
	RootDir      string
	Pattern      string
}


func PrintCfg(cfg ImagesConfig){

	fmt.Printf("Source: %s\nDryrun: %v\n", cfg.Source, cfg.DryRun)
	fmt.Printf("DateFromExif: %v\nRootDir: %s\nPattern: %s\n", cfg.DateFromExif, cfg.RootDir, cfg.Pattern)

}