-- +goose Up
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlap;

ALTER TABLE bookings
  ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC',
  ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

ALTER TABLE bookings
ADD CONSTRAINT no_overlap EXCLUDE USING gist (
    desk_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status = 'confirmed');

-- +goose Down
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlap;

ALTER TABLE bookings
    ALTER COLUMN start_time TYPE TIMESTAMP USING start_time AT TIME ZONE 'UTC',
    ALTER COLUMN end_time TYPE TIMESTAMP USING end_time AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMP USING created_at AT TIME ZONE 'UTC';

ALTER TABLE bookings
ADD CONSTRAINT no_overlap EXCLUDE USING gist (
    desk_id WITH =,
    tsrange(start_time, end_time, '[)') WITH &&
);