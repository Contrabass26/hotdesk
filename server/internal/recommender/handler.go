package recommender

import (
	"errors"
	"net/http"

	"hotdesk/server/internal/utils"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/recommender", h.handleScoreDesk)
}

func (h *Handler) handleScoreDesk(w http.ResponseWriter, r *http.Request) {
	var input ScoreInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	score, err := h.service.ScoreDesk(r.Context(), input)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidUserInput),
			errors.Is(err, ErrInvalidDeskInput),
			errors.Is(err, ErrInvalidTimeRange):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrDeskNotFound),
			errors.Is(err, ErrUserNotFound):
			utils.WriteError(w, http.StatusNotFound, err.Error())
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, score)
}
