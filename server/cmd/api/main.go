package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"hotdesk/server/config"
	"hotdesk/server/internal/bookings"
	"hotdesk/server/internal/database"
	"hotdesk/server/internal/desks"
	"hotdesk/server/internal/middleware"
	"hotdesk/server/internal/router"
	"hotdesk/server/internal/users"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("invalid configuration: %w", err)
	}

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("database connection failed: %w", err)
	}
	defer pool.Close()

	usersHandler := users.NewHandler(users.NewService(users.NewStore(pool)))
	desksHandler := desks.NewHandler(desks.NewService(desks.NewStore(pool)))
	bookingsHandler := bookings.NewHandler(bookings.NewService(bookings.NewStore(pool)))

	appRouter := router.New("hotdesk-server", usersHandler, desksHandler, bookingsHandler)
	server := &http.Server{Addr: ":" + cfg.Port, Handler: middleware.Logger(appRouter)}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("graceful shutdown error: %v", err)
		}
	}()

	log.Printf("hotdesk-server listening on :%s", cfg.Port)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("server failed: %w", err)
	}
	return nil
}
