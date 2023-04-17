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
    trip_id SERIAL PRIMARY KEY,
    link VARCHAR(200) NOT NULL,
    location VARCHAR(50) NOT NULL,
    duration INTEGER NOT NULL
);
