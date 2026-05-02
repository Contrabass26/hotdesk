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
	"hotdesk/server/internal/floors"
	"hotdesk/server/internal/middleware"
	"hotdesk/server/internal/recommender"
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

	usersService := users.NewService(users.NewStore(pool))
	desksService := desks.NewService(desks.NewStore(pool))
	bookingsService := bookings.NewService(bookings.NewStore(pool))
	floorsService := floors.NewService(floors.NewStore(pool, cfg.StoragePath))

	usersHandler := users.NewHandler(usersService)
	desksHandler := desks.NewHandler(desksService)
	bookingsHandler := bookings.NewHandler(bookingsService)
	floorsHandler := floors.NewHandler(floorsService)

	recommenderStore := recommender.NewStore(pool)
	recommenderService := recommender.NewService(
		recommenderStore,
		usersService,
		desksService,
		bookingsService,
	)
	recommenderHandler := recommender.NewHandler(recommenderService)

	appRouter := router.New("hotdesk-server", usersHandler, desksHandler, bookingsHandler, floorsHandler, recommenderHandler)
	handler := middleware.Logger(middleware.CORS(cfg.CORSAllowedOrigins, appRouter))
	server := &http.Server{Addr: ":" + cfg.Port, Handler: handler}

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
