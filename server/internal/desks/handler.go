package desks

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"hotdesk/server/internal/utils"
)

type Handler struct {
	service Service
}

type availabilityResponse struct {
	StartTime time.Time          `json:"startTime"`
	EndTime   time.Time          `json:"endTime"`
	Desks     []DeskAvailability `json:"desks"`
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/desks/availability", h.handleListAvailability)
	mux.HandleFunc("GET /api/desks", h.handleList)
	mux.HandleFunc("GET /api/desks/{id}", h.handleGetByID)
	mux.HandleFunc("PATCH /api/desks/{id}", h.handleUpdate)
	mux.HandleFunc("POST /api/desks", h.handleCreate)
}

func (h *Handler) handleList(w http.ResponseWriter, r *http.Request) {
	floorID, err := utils.ParseOptionalPositiveID(r.URL.Query(), "floorId")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	enabled, err := utils.ParseOptionalBool(r.URL.Query(), "enabled")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	limit, err := utils.ParseOptionalInt(r.URL.Query(), "limit")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	items, err := h.service.List(r.Context(), ListFilter{
		FloorID:   floorID,
		IsEnabled: enabled,
		Limit:     limit,
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

	utils.WriteJSON(w, http.StatusOK, items)
}

func (h *Handler) handleGetByID(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	desk, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "desk not found")
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, desk)
}

func (h *Handler) handleUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	var body struct {
		IsEnabled bool `json:"isEnabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	desk, err := h.service.Update(r.Context(), id, body.IsEnabled)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "desk not found")
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, desk)
}

func (h *Handler) handleCreate(w http.ResponseWriter, r *http.Request) {
	var input CreateInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	desk, err := h.service.Create(r.Context(), input)
	if err != nil {
		switch {
		case errors.Is(err, ErrNotFound),
			errors.Is(err, ErrInvalidInput),
			errors.Is(err, ErrReferenceNotFound):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusCreated, desk)
}

func (h *Handler) handleListAvailability(w http.ResponseWriter, r *http.Request) {
	start, err := utils.ParseRequiredTime(r.URL.Query(), "start")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	end, err := utils.ParseRequiredTime(r.URL.Query(), "end")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	floorID, err := utils.ParseOptionalPositiveID(r.URL.Query(), "floorId")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	items, err := h.service.ListAvailability(r.Context(), AvailabilityFilter{
		StartTime: start,
		EndTime:   end,
		FloorID:   floorID,
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

	utils.WriteJSON(w, http.StatusOK, availabilityResponse{
		StartTime: start,
		EndTime:   end,
		Desks:     items,
	})
}
