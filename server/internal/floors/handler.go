package floors

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
	mux.HandleFunc("GET /api/floors", h.handleList)
	mux.HandleFunc("GET /api/floors/{id}", h.handleGetByID)
	mux.HandleFunc("DELETE /api/floors/{id}", h.handleDelete)
	mux.HandleFunc("POST /api/floors", h.handleCreate)
}

func (h *Handler) handleList(w http.ResponseWriter, r *http.Request) {
	limit, err := utils.ParseOptionalInt(r.URL.Query(), "limit")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	floors, err := h.service.List(r.Context(), ListFilter{
		Limit: limit,
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

	utils.WriteJSON(w, http.StatusOK, floors)
}

func (h *Handler) handleGetByID(w http.ResponseWriter, r *http.Request) {
	h.handleGet(w, r, r.PathValue("id"))
}

func (h *Handler) handleGet(w http.ResponseWriter, r *http.Request, rawID string) {
	id, err := utils.ParsePositiveID(rawID, "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	floor, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "floor not found")
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, floor)
}

func (h *Handler) handleDelete(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	err = h.service.Delete(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "floor not found")
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}
}

func (h *Handler) handleCreate(w http.ResponseWriter, r *http.Request) {
	var input CreateInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	floor, err := h.service.Create(r.Context(), input.Name)
	if err != nil {
		println(err.Error())
		utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	utils.WriteJSON(w, http.StatusCreated, floor)
}
