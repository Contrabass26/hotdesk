package floors

import (
	"context"
	"errors"
	"log"
	"os"
	"strconv"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	GetByID(ctx context.Context, id int64) (Floor, error)
	List(ctx context.Context, filter ListFilter) ([]Floor, error)
	Delete(ctx context.Context, id int64) error
	Create(ctx context.Context, input CreateInput) (Floor, error)
}

type store struct {
	pool        *pgxpool.Pool
	storagePath string
}

func NewStore(pool *pgxpool.Pool, storagePath string) Store {
	return &store{
		pool:        pool,
		storagePath: storagePath,
	}
}

func (s *store) GetFloorPlanDir() string {
	return s.storagePath + "/floor-plan"
}

func (s *store) GetFloorPlanPath(id int64) string {
	return s.GetFloorPlanDir() + "/" + strconv.FormatInt(id, 10)
}

// LoadFloorPlan
// Loads the floor plan for a floor id and returns it in base64 encoding
func (s *store) LoadFloorPlan(id int64) (string, error) {
	// Read file
	bytes, err := os.ReadFile(s.GetFloorPlanPath(id))
	if err != nil {
		// If the floor doesn't have an image, we won't make a big deal of it
		if errors.Is(err, os.ErrNotExist) {
			log.Println("no floor plan found for id ", id)
			return "", nil
		}
		return "", err
	}
	image := string(bytes)
	return image, nil
}

func (s *store) GetByID(ctx context.Context, id int64) (Floor, error) {
	const query = `
		SELECT floor_id, name, image
		FROM floors
		WHERE floor_id = $1
	`

	var floor Floor
	err := scanFloor(s.pool.QueryRow(ctx, query, id), &floor)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Floor{}, ErrNotFound
		}
		return Floor{}, err
	}

	// Load image from file
	image, err := s.LoadFloorPlan(floor.ID)
	if err != nil {
		return Floor{}, err
	}

	floor.Image = image
	return floor, nil
}

func (s *store) List(ctx context.Context, filter ListFilter) ([]Floor, error) {
	const query = `
		SELECT floor_id, name
		FROM floors
		ORDER BY floor_id
		LIMIT $1
	`

	rows, err := s.pool.Query(ctx, query, filter.Limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Floor, 0)
	for rows.Next() {
		var floor Floor
		if err := scanFloor(rows, &floor); err != nil {
			return nil, err
		}
		// Load image from file
		image, err := s.LoadFloorPlan(floor.ID)
		if err != nil {
			return nil, err
		}
		floor.Image = image
		items = append(items, floor)
	}

	return items, rows.Err()
}

func (s *store) Delete(ctx context.Context, id int64) error {
	// Delete all bookings for desks on this floor
	const bookingQuery = `
		DELETE FROM bookings b
		USING desks d
	   	WHERE b.desk_id = d.desk_id 
	   	    AND d.floor_id = $1
	`
	res, err := s.pool.Exec(ctx, bookingQuery, id)
	if err != nil {
		return err
	}

	// Delete all the desks on this floor
	const desksQuery = `
		DELETE FROM desks
		WHERE floor_id = $1
	`
	res, err = s.pool.Exec(ctx, desksQuery, id)
	if err != nil {
		return err
	}

	// Delete the floor itself
	const floorQuery = `
		DELETE FROM floors 
		WHERE floor_id = $1
	`
	res, err = s.pool.Exec(ctx, floorQuery, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return ErrNotFound
	}

	// Delete the floor plan image
	if err = os.Remove(s.GetFloorPlanPath(id)); err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}

	return nil
}

func (s *store) Create(ctx context.Context, input CreateInput) (Floor, error) {
	const query = `
		INSERT INTO floors (name)
		VALUES ($1)
		RETURNING floor_id, name
	`

	var floor Floor
	err := scanFloor(s.pool.QueryRow(ctx, query, input.Name), &floor)
	if err != nil {
		return Floor{}, err
	}
	floor.Image = input.Image

	// Create the image directory if not present
	if err := os.MkdirAll(s.GetFloorPlanDir(), 0o755|os.ModeDir); err != nil {
		return Floor{}, err
	}
	// Write image to file
	if err := os.WriteFile(s.GetFloorPlanPath(floor.ID), []byte(input.Image), 0o755); err != nil {
		return Floor{}, err
	}

	return floor, err
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanFloor(row rowScanner, floor *Floor) error {
	if err := row.Scan(&floor.ID, &floor.Name); err != nil {
		return err
	}
	return nil
}
