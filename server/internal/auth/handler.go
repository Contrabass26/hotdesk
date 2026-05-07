package auth

import (
	"context"
	"errors"
	"net/http"
	"time"

	"hotdesk/server/internal/utils"
)

type Handler struct {
	cookieSecure bool
	service      Service
}

func NewHandler(service Service, cookieSecure bool) *Handler {
	return &Handler{
		cookieSecure: cookieSecure,
		service:      service,
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/auth/signup", h.handleSignup)
	mux.HandleFunc("POST /api/auth/login", h.handleLogin)
	mux.HandleFunc("GET /api/auth/demo-users", h.handleDemoUsers)
	mux.HandleFunc("POST /api/auth/demo-login", h.handleDemoLogin)
	mux.HandleFunc("POST /api/auth/logout", h.handleLogout)
	mux.HandleFunc("GET /api/auth/me", h.handleMe)
}

func (h *Handler) handleSignup(w http.ResponseWriter, r *http.Request) {
	handleSessionRequest(w, r, h, http.StatusCreated, h.service.Signup)
}

func (h *Handler) handleLogin(w http.ResponseWriter, r *http.Request) {
	handleSessionRequest(w, r, h, http.StatusOK, h.service.Login)
}

func (h *Handler) handleDemoUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.ListDemoUsers(r.Context())
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	utils.WriteJSON(w, http.StatusOK, users)
}

func (h *Handler) handleDemoLogin(w http.ResponseWriter, r *http.Request) {
	handleSessionRequest(w, r, h, http.StatusOK, h.service.DemoLogin)
}

func (h *Handler) handleLogout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(CookieName); err == nil {
		if err := h.service.Logout(r.Context(), cookie.Value); err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
			return
		}
	}

	h.clearSessionCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) handleMe(w http.ResponseWriter, r *http.Request) {
	actor, ok := ActorFromContext(r.Context())
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, ErrUnauthenticated.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, actor)
}

type sessionIssuer[T any] func(context.Context, T) (string, AuthResponse, error)

func handleSessionRequest[T any](w http.ResponseWriter, r *http.Request, h *Handler, status int, issue sessionIssuer[T]) {
	var input T
	if err := utils.DecodeJSONStrict(r, &input); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	token, response, err := issue(r.Context(), input)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailTaken):
			utils.WriteError(w, http.StatusConflict, err.Error())
		case errors.Is(err, ErrInvalidCredentials), errors.Is(err, ErrInvalidSession):
			utils.WriteError(w, http.StatusUnauthorized, err.Error())
		case errors.Is(err, ErrInvalidInput), errors.Is(err, ErrInvalidTeam):
			utils.WriteError(w, http.StatusBadRequest, err.Error())
		default:
			utils.WriteError(w, http.StatusInternalServerError, "internal server error")
		}
		return
	}

	h.setSessionCookie(w, token, response.ExpiresAt)
	utils.WriteJSON(w, status, response)
}

func (h *Handler) setSessionCookie(w http.ResponseWriter, token string, expiresAt time.Time) {
	http.SetCookie(w, h.sessionCookie(token, expiresAt, int(time.Until(expiresAt).Seconds())))
}

func (h *Handler) clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, h.sessionCookie("", time.Unix(0, 0), -1))
}

func (h *Handler) sessionCookie(value string, expiresAt time.Time, maxAge int) *http.Cookie {
	return &http.Cookie{
		Name:     CookieName,
		Value:    value,
		Path:     "/",
		Expires:  expiresAt,
		MaxAge:   maxAge,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.cookieSecure,
	}
}
