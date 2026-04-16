package router

import (
	"net/http"
	"time"

	"hotdesk/server/internal/utils"
)

type Registrar interface {
	RegisterRoutes(mux *http.ServeMux)
}

type Deps struct {
	ServiceName string
	Users       Registrar
	Desks       Registrar
	Bookings    Registrar
}

func New(serviceName string, handlers ...Registrar) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		utils.WriteJSON(w, http.StatusOK, map[string]any{
			"status":  "ok",
			"service": serviceName,
			"time":    time.Now(),
		})
	})

	for _, handler := range handlers {
		handler.RegisterRoutes(mux)
	}

	return mux
}
