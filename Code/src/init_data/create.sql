CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password CHAR(60) NOT NULL
);

CREATE TABLE user_to_trips(
    user_id SMALLINT,
    trip_id SMALLINT
);

CREATE TABLE past_trips(
    trip_id SMALLINT,
    link VARCHAR(200) NOT NULL,
    location VARCHAR(50) NOT NULL,
    duration INTEGER NOT NULL
);

CREATE TABLE trips(
 trip_id SERIAL PRIMARY KEY,
 trip_name VARCHAR(50) NOT NULL,
 country VARCHAR(50) NOT NULL,
 state_ VARCHAR(50) NOT NULL,
 summit_ SMALLINT,
 base SMALLINT,
 verticle SMALLINT,
 lifts SMALLINT,
 runs SMALLINT,
 lat DECIMAL,
 lon DECIMAL,
);
