package users

type User struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	IsAdmin bool   `json:"isAdmin"`
	TeamID  *int64 `json:"teamId,omitempty"`
}

type ListFilter struct {
	TeamID  *int64
	IsAdmin *bool
	Limit   int
}
