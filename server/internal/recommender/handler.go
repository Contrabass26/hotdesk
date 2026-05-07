package recommender

import (
	"errors"
	"log"
	"net/http"

	"hotdesk/server/internal/auth"
	"hotdesk/server/internal/middleware"
	"hotdesk/server/internal/utils"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	requireAuth := middleware.RequireAuthFunc

	mux.Handle("POST /api/recommender", requireAuth(h.handleScoreDesk))
}

func (h *Handler) handleScoreDesk(w http.ResponseWriter, r *http.Request) {
	var input ScoreInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	actor, _ := auth.ActorFromContext(r.Context())
	score, err := h.service.ScoreDeskForActor(r.Context(), actor, input)
	if err != nil {
		log.Printf("Error scoring desk: %v", err)
		switch {
		case errors.Is(err, ErrInvalidUserInput),
			errors.Is(err, ErrInvalidDeskInput),
			errors.Is(err, ErrInvalidTimeRange),
			errors.Is(err, ErrUserHasNoTeam):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDeskNotFound),
			errors.Is(err, ErrUserNotFound):
			utils.WriteError(w, http.StatusNotFound, err.Error())
		case errors.Is(err, auth.ErrForbidden):
			utils.WriteError(w, http.StatusForbidden, err.Error())
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, score)
}
