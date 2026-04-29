package floors

type Floor struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type ListFilter struct {
	Limit int
}
