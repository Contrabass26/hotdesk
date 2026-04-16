package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"hotdesk/server/config"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("invalid configuration: %v", err)
	}

	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to create pool: %v", err)
	}
	defer pool.Close()

	db := stdlib.OpenDBFromPool(pool)
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping database: %v", err)
	}

	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("failed to set goose dialect: %v", err)
	}

	command := "up"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}

	switch command {
	case "up":
		if err := goose.Up(db, "migrations"); err != nil {
			log.Fatalf("up failed: %v", err)
		}
		fmt.Println("up complete")
	case "down":
		steps := 1
		if len(os.Args) > 2 {
			parsed, err := strconv.Atoi(os.Args[2])
			if err != nil || parsed <= 0 {
				log.Fatalf("down steps must be a positive integer")
			}
			steps = parsed
		}

		for range steps {
			if err := goose.Down(db, "migrations"); err != nil {
				log.Fatalf("down failed: %v", err)
			}
		}
		fmt.Printf("down complete (steps=%d)\n", steps)
	case "status":
		if err := goose.Status(db, "migrations"); err != nil {
			log.Fatalf("status failed: %v", err)
		}
	case "version":
		version, err := goose.GetDBVersion(db)
		if err != nil {
			log.Fatalf("version failed: %v", err)
		}
		fmt.Printf("version: %d\n", version)
	default:
		log.Fatalf("unknown command %q (supported: up, down [steps], status, version)", command)
	}
}
