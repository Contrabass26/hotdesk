package auth

import "time"

type Actor struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	IsAdmin bool   `json:"isAdmin"`
	TeamID  *int64 `json:"teamId,omitempty"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SignupInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	TeamID   int64  `json:"teamId"`
}

type DemoLoginInput struct {
	UserID int64 `json:"userId"`
}

type AuthResponse struct {
	User      Actor     `json:"user"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type localUser struct {
	Actor
	PasswordHash string
}
