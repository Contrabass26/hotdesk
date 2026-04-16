package bookings

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
	mux.HandleFunc("GET /api/bookings", h.handleList)
	mux.HandleFunc("POST /api/bookings", h.handleCreate)
	mux.HandleFunc("GET /api/bookings/{id}", h.handleGetByID)
	mux.HandleFunc("PATCH /api/bookings/{id}/cancel", h.handleCancel)
}

func (h *Handler) handleCreate(w http.ResponseWriter, r *http.Request) {
	var input CreateInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	booking, err := h.service.Create(r.Context(), input)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidUserID),
			errors.Is(err, ErrInvalidDeskID),
			errors.Is(err, ErrInvalidTimeRange),
			errors.Is(err, ErrInvalidInput),
			errors.Is(err, ErrReferenceNotFound):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrConflict):
			utils.WriteError(w, http.StatusConflict, err.Error())
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusCreated, booking)
}

func (h *Handler) handleList(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ParseOptionalPositiveID(r.URL.Query(), "userId")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	deskID, err := utils.ParseOptionalPositiveID(r.URL.Query(), "deskId")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	startTime, err := utils.ParseOptionalTime(r.URL.Query(), "start")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	endTime, err := utils.ParseOptionalTime(r.URL.Query(), "end")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	status := utils.ParseOptionalTrimmedString(r.URL.Query(), "status")

	limit, err := utils.ParseOptionalInt(r.URL.Query(), "limit")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	bookings, err := h.service.List(r.Context(), ListFilter{
		UserID:    userID,
		DeskID:    deskID,
		Status:    status,
		StartTime: startTime,
		EndTime:   endTime,
		Limit:     limit,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidUserID),
			errors.Is(err, ErrInvalidDeskID),
			errors.Is(err, ErrInvalidStatus),
			errors.Is(err, ErrInvalidTimeRange),
			errors.Is(err, ErrInvalidLimit):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, bookings)
}

func (h *Handler) handleGetByID(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	booking, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidID):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "booking not found")
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, booking)
}

func (h *Handler) handleCancel(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	booking, err := h.service.Cancel(r.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidID):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "booking not found")
		case errors.Is(err, ErrNotCancellable), errors.Is(err, ErrConflict):
			utils.WriteError(w, http.StatusConflict, err.Error())
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	utils.WriteJSON(w, http.StatusOK, booking)
}
