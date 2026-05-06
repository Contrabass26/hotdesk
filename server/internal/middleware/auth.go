package middleware

import (
	"net/http"

	"hotdesk/server/internal/auth"
)

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

		ctx := auth.ContextWithActor(r.Context(), actor, cookie.Value)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
