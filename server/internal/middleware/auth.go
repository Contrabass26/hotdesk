package middleware

import (
	"net/http"

	"hotdesk/server/internal/auth"
	"hotdesk/server/internal/utils"
)

// OptionalAuthSession attempts to authenticate the request using the session cookie.
// If authentication succeeds, the authenticated actor is attached to the request context.
// Requests without a valid session continue as anonymous.
func OptionalAuthSession(service auth.Service, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(auth.CookieName)
		if err != nil || cookie.Value == "" {
			next.ServeHTTP(w, r)
			return
		}

		actor, err := service.AuthenticateToken(r.Context(), cookie.Value)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		ctx := auth.ContextWithActor(r.Context(), actor)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := auth.ActorFromContext(r.Context()); !ok {
			utils.WriteError(w, http.StatusUnauthorized, auth.ErrUnauthenticated.Error())
			return
		}

		next.ServeHTTP(w, r)
	})
}

func RequireAuthFunc(next http.HandlerFunc) http.Handler {
	return RequireAuth(next)
}

func RequireAdmin(next http.Handler) http.Handler {
	return RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		actor, _ := auth.ActorFromContext(r.Context())
		if !actor.IsAdmin {
			utils.WriteError(w, http.StatusForbidden, auth.ErrForbidden.Error())
			return
		}

		next.ServeHTTP(w, r)
	}))
}

func RequireAdminFunc(next http.HandlerFunc) http.Handler {
	return RequireAdmin(next)
}
