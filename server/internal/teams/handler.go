package teams

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
	mux.HandleFunc("GET /api/departments", h.handleListDepartments)
	mux.HandleFunc("POST /api/departments", h.handleCreateDepartment)
	mux.HandleFunc("GET /api/departments/{id}", h.handleGetDepartmentByID)
	mux.HandleFunc("PATCH /api/departments/{id}", h.handleUpdateDepartment)
	mux.HandleFunc("DELETE /api/departments/{id}", h.handleDeleteDepartment)
	mux.HandleFunc("GET /api/teams", h.handleList)
	mux.HandleFunc("POST /api/teams", h.handleCreate)
	mux.HandleFunc("GET /api/teams/{id}", h.handleGetByID)
	mux.HandleFunc("PATCH /api/teams/{id}", h.handleUpdate)
	mux.HandleFunc("DELETE /api/teams/{id}", h.handleDelete)
}

func (h *Handler) handleCreateDepartment(w http.ResponseWriter, r *http.Request) {
	var input CreateDepartmentInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	department, err := h.service.CreateDepartment(r.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, department)
}

func (h *Handler) handleCreate(w http.ResponseWriter, r *http.Request) {
	var input CreateInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	team, err := h.service.Create(r.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusCreated, team)
}

func (h *Handler) handleDeleteDepartment(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.DeleteDepartment(r.Context(), id); err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, struct{}{})
}

func (h *Handler) handleDelete(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, struct{}{})
}

func (h *Handler) handleGetDepartmentByID(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	department, err := h.service.GetDepartmentByID(r.Context(), id)
	if err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, department)
}

func (h *Handler) handleGetByID(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	team, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, team)
}

func (h *Handler) handleListDepartments(w http.ResponseWriter, r *http.Request) {
	limit, err := utils.ParseOptionalInt(r.URL.Query(), "limit")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	items, err := h.service.ListDepartments(r.Context(), DepartmentListFilter{Limit: limit})
	if err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, items)
}

func (h *Handler) handleList(w http.ResponseWriter, r *http.Request) {
	limit, err := utils.ParseOptionalInt(r.URL.Query(), "limit")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	items, err := h.service.List(r.Context(), ListFilter{Limit: limit})
	if err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, items)
}

func (h *Handler) handleUpdateDepartment(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	var input UpdateDepartmentInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	department, err := h.service.UpdateDepartment(r.Context(), id, input)
	if err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, department)
}

func (h *Handler) handleUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := utils.ParsePositiveID(r.PathValue("id"), "id")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	var input UpdateInput
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	team, err := h.service.Update(r.Context(), id, input)
	if err != nil {
		writeError(w, err)
		return
	}

	utils.WriteJSON(w, http.StatusOK, team)
}

func writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrConflict):
		utils.WriteError(w, http.StatusConflict, err.Error())
	case errors.Is(err, ErrForeignKeyViolation), errors.Is(err, ErrInvalidInput):
		utils.WriteError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrDepartmentNotFound), errors.Is(err, ErrTeamNotFound):
		utils.WriteError(w, http.StatusNotFound, err.Error())
	default:
		utils.WriteError(w, http.StatusInternalServerError, "internal server error")
	}
}
