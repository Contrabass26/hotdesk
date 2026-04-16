-- +goose Up
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_desk_id ON bookings(desk_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_desks_floor_id ON desks(floor_id);

-- +goose Down
DROP INDEX IF EXISTS idx_desks_floor_id;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_desk_id;
DROP INDEX IF EXISTS idx_bookings_user_id;
