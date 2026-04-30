
-- Required for the overlap constraint on bookings
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE departments (
    department_id   SERIAL PRIMARY KEY,
    name            VARCHAR(30) NOT NULL
);

-- ------------------------------------------------------------
-- TEAMS
-- Each team belongs to one department.
-- Users belong to teams.
-- ------------------------------------------------------------
CREATE TABLE teams (
    team_id         SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    department_id   INT NOT NULL REFERENCES departments(department_id)
);


-- ------------------------------------------------------------
-- FLOORS
-- Physical floors in the office. Desks belong to a floor.
-- ------------------------------------------------------------
CREATE TABLE floors (
    floor_id        SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL
);


-- ------------------------------------------------------------
-- USERS
-- Both employees and admins. Admins may have no team.
-- password_hash for Isaac if you want
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    team_id         INT REFERENCES teams(team_id)
);


-- ------------------------------------------------------------
-- DESKS
-- Each desk has x/y coordinates on its floor for Olmo to determine adjacency
-- is_enabled allows admins to disable desks (if for example they're broken)
-- ------------------------------------------------------------
CREATE TABLE desks (
    desk_id         SERIAL PRIMARY KEY,
    floor_id        INT NOT NULL REFERENCES floors(floor_id),
    label           VARCHAR(50) NOT NULL,
    x_coord         NUMERIC(5,2) NOT NULL,
    y_coord         NUMERIC(5,2) NOT NULL,
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE
);


-- ------------------------------------------------------------
-- BOOKINGS
-- Links a user to a desk for a time period.
-- status: 'confirmed', 'cancelled', 'no_show'
-- The EXCLUDE constraint prevents overlapping bookings on the same desk.
-- ------------------------------------------------------------
CREATE TABLE bookings (
    booking_id      SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(user_id),
    desk_id         INT NOT NULL REFERENCES desks(desk_id),
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_overlap EXCLUDE USING gist (
        desk_id WITH =,
        tsrange(start_time, end_time) WITH &&
    )
);

-- ------------------------------------------------------------
-- WALLS
-- Has start and end x and y coordinates
-- Connected to floors table
-- Indexed by an id
-- ------------------------------------------------------------
CREATE TABLE walls (
    wall_id         SERIAL PRIMARY KEY,
    floor_id        INT NOT NULL REFERENCES floors(floor_id),
    x_start         NUMERIC(5,2) NOT NULL,
    y_start         NUMERIC(5,2) NOT NULL,
    x_end           NUMERIC(5,2) NOT NULL,
    y_end           NUMERIC(5,2) NOT NULL
);


-- ============================================================
-- TEST DATA
-- ============================================================

INSERT INTO departments (name) VALUES
    ('Engineering'),
    ('Marketing'),
    ('Sales');

INSERT INTO teams (name, department_id) VALUES
    ('Backend',     1),
    ('Frontend',    1),
    ('Growth',      2),
    ('Brand',       2),
    ('Enterprise',  3);

INSERT INTO floors (name) VALUES
    ('Floor 1');

INSERT INTO desks (floor_id, label, x_coord, y_coord, is_enabled) VALUES
    (1, 'A1', 1.00, 1.00, TRUE),
    (1, 'A2', 2.00, 1.00, TRUE),
    (1, 'A3', 3.00, 1.00, TRUE),
    (1, 'B1', 1.00, 2.00, TRUE),
    (1, 'B2', 2.00, 2.00, TRUE),
    (1, 'B3', 3.00, 2.00, TRUE),
    (1, 'C1', 1.00, 3.00, TRUE),
    (1, 'C2', 2.00, 3.00, TRUE);

INSERT INTO users (name, email, password_hash, is_admin, team_id) VALUES
    ('Alice',  'alice@company.com',  '$2b$12$placeholder.hash.for.testing.only', FALSE, 1),
    ('Bob',    'bob@company.com',    '$2b$12$placeholder.hash.for.testing.only', FALSE, 1),
    ('Carol',  'carol@company.com',  '$2b$12$placeholder.hash.for.testing.only', FALSE, 2),
    ('David',  'david@company.com',  '$2b$12$placeholder.hash.for.testing.only', FALSE, 3),
    ('Eve',    'eve@company.com',    '$2b$12$placeholder.hash.for.testing.only', FALSE, 4),
    ('Frank',  'frank@company.com',  '$2b$12$placeholder.hash.for.testing.only', FALSE, 5),
    ('Grace',  'grace@company.com',  '$2b$12$placeholder.hash.for.testing.only', FALSE, 2),
    ('Admin',  'admin@company.com',  '$2b$12$placeholder.hash.for.testing.only', TRUE,  NULL);

INSERT INTO bookings (user_id, desk_id, start_time, end_time, status) VALUES
    (1, 1, '2025-03-10 09:00:00', '2025-03-10 17:00:00', 'confirmed'),
    (2, 2, '2025-03-10 09:00:00', '2025-03-10 13:00:00', 'confirmed'),
    (3, 3, '2025-03-10 09:00:00', '2025-03-10 17:00:00', 'no_show'),
    (4, 4, '2025-03-10 09:00:00', '2025-03-10 17:00:00', 'confirmed'),
    (1, 1, '2025-03-11 09:00:00', '2025-03-11 13:00:00', 'confirmed'),
    (5, 2, '2025-03-11 09:00:00', '2025-03-11 17:00:00', 'cancelled'),
    (6, 3, '2025-03-11 09:00:00', '2025-03-11 17:00:00', 'confirmed'),
    (2, 5, '2025-03-11 14:00:00', '2025-03-11 17:00:00', 'confirmed'),
    (7, 6, '2025-03-12 09:00:00', '2025-03-12 17:00:00', 'no_show'),
    (3, 7, '2025-03-12 09:00:00', '2025-03-12 13:00:00', 'confirmed');
