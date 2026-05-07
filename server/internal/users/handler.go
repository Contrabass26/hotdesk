package users

import (
	"encoding/json"
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
	mux.HandleFunc("GET /api/users", h.handleList)
	mux.HandleFunc("GET /api/users/{id}", h.handleGetByID)
	mux.HandleFunc("PATCH /api/users/{id}", h.handleUpdate)
	mux.HandleFunc("GET /user/getuser", h.handleLegacyGetByID)
}

func (h *Handler) handleList(w http.ResponseWriter, r *http.Request) {
	teamID, err := utils.ParseOptionalPositiveID(r.URL.Query(), "teamId")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	isAdmin, err := utils.ParseOptionalBool(r.URL.Query(), "isAdmin")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	limit, err := utils.ParseOptionalInt(r.URL.Query(), "limit")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	users, err := h.service.List(r.Context(), ListFilter{
		TeamID:  teamID,
		IsAdmin: isAdmin,
		Limit:   limit,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, users)
}

func (h *Handler) handleUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	var body struct {
		IsAdmin bool   `json:"isAdmin"`
		TeamID  *int64 `json:"teamId,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.service.Update(r.Context(), id, body.IsAdmin, body.TeamID)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "user not found")
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, user)
}

func (h *Handler) handleGetByID(w http.ResponseWriter, r *http.Request) {
	h.handleGet(w, r, r.PathValue("id"))
}

func (h *Handler) handleLegacyGetByID(w http.ResponseWriter, r *http.Request) {
	h.handleGet(w, r, r.URL.Query().Get("id"))
}

func (h *Handler) handleGet(w http.ResponseWriter, r *http.Request, rawID string) {
	id, err := utils.ParsePositiveID(rawID, "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "user not found")
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, user)
}
