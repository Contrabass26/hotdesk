package bookings

import (
	"errors"
	"hotdesk/server/internal/utils"
	"net/http"
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
	mux.HandleFunc("GET /api/bookings/predict", h.handlePredictNumBookings)
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

	date, err := utils.ParseOptionalDate(r.URL.Query(), "date")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	weekday, err := utils.ParseOptionalInt(r.URL.Query(), "weekday")
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
		UserID:  userID,
		DeskID:  deskID,
		Status:  status,
		Date:    date,
		Weekday: weekday,
		Limit:   limit,
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
			println("Internal error: " + err.Error())
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

// handlePredictNumBookings
// Handles all forms of booking prediction: for a particular day, or intersecting a particular time
func (h *Handler) handlePredictNumBookings(w http.ResponseWriter, r *http.Request) {
	// First check for a "day" parameter
	query, err := utils.ParseOptionalDate(r.URL.Query(), "day")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// If there's a day parameter, make a prediction for the day
	if query != nil {
		prediction, err := h.service.PredictNumBookings(r.Context(), *query)
		if err != nil {
			if errors.Is(err, ErrInvalidWeekday) {
				utils.WriteError(w, http.StatusBadRequest, err.Error())
			} else {
				utils.WriteError(w, http.StatusInternalServerError, "internal server error")
			}
			return
		}
		utils.WriteJSON(w, http.StatusOK, prediction)
	} else {
		// There must be a "time" parameter
		query, err := utils.ParseRequiredTime(r.URL.Query(), "time")
		if err != nil {
			utils.WriteError(w, http.StatusBadRequest, err.Error())
			return
		}
		// Predict how many bookings will intersect with this time
		prediction, err := h.service.PredictBookingIntersection(r.Context(), query)
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
			return
		}
		utils.WriteJSON(w, http.StatusOK, prediction)
	}
}
