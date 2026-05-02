package config

import (
	"errors"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	CORSAllowedOrigins []string
	StoragePath        string
}

func Load() (Config, error) {
	if err := godotenv.Load(); err != nil {
		log.Printf("failed to load .env file: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Println("PORT not set, defaulting to 8080")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}

	corsAllowedOrigins, err := loadCORSAllowedOrigins()
	if err != nil {
		return Config{}, err
	}

	storagePath := os.Getenv("STORAGE_PATH")

	return Config{
		Port:               port,
		DatabaseURL:        databaseURL,
		CORSAllowedOrigins: corsAllowedOrigins,
		StoragePath:        storagePath,
	}, nil
}

func loadCORSAllowedOrigins() ([]string, error) {
	value := os.Getenv("CORS_ALLOWED_ORIGINS")
	if strings.TrimSpace(value) == "" {
		return nil, errors.New("CORS_ALLOWED_ORIGINS is required")
	}

	origins := make([]string, 0)
	for _, origin := range strings.Split(value, ",") {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return nil, errors.New("CORS_ALLOWED_ORIGINS must contain at least one origin")
	}

	return origins, nil
}
