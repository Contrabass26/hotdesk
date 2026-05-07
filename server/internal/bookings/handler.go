package bookings

import (
	"errors"
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
	requireAdmin := middleware.RequireAdminFunc

	mux.Handle("GET /api/bookings", requireAuth(h.handleList))
	mux.Handle("POST /api/bookings", requireAuth(h.handleCreate))
	mux.Handle("GET /api/bookings/{id}", requireAuth(h.handleGetByID))
	mux.Handle("PATCH /api/bookings/{id}/cancel", requireAuth(h.handleCancel))
	mux.Handle("GET /api/bookings/predict", requireAdmin(h.handlePredictNumBookings))
}

func (h *Handler) handleCreate(w http.ResponseWriter, r *http.Request) {
	var input CreateInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	actor, _ := auth.ActorFromContext(r.Context())
	booking, err := h.service.CreateForActor(r.Context(), actor, input)
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

	start, err := utils.ParseOptionalDate(r.URL.Query(), "start")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	end, err := utils.ParseOptionalDate(r.URL.Query(), "end")
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

	filter := ListFilter{
		UserID:  userID,
		DeskID:  deskID,
		Status:  status,
		Date:    date,
		Start:   start,
		End:     end,
		Weekday: weekday,
		Limit:   limit,
	}

	actor, _ := auth.ActorFromContext(r.Context())
	bookings, err := h.service.ListForActor(r.Context(), actor, filter)
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

	actor, _ := auth.ActorFromContext(r.Context())
	booking, err := h.service.GetByIDForActor(r.Context(), actor, id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidID):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "booking not found")
		case errors.Is(err, auth.ErrForbidden):
			utils.WriteError(w, http.StatusForbidden, err.Error())
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

	actor, _ := auth.ActorFromContext(r.Context())
	booking, err := h.service.CancelForActor(r.Context(), actor, id)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidID):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrNotFound):
			utils.WriteError(w, http.StatusNotFound, "booking not found")
		case errors.Is(err, auth.ErrForbidden):
			utils.WriteError(w, http.StatusForbidden, err.Error())
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
