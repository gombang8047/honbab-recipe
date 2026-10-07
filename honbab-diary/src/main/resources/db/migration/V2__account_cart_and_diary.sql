-- Shopping-list snapshots intentionally do not depend on product mappings.
-- Prices here are display estimates, never a source of truth for payment.
CREATE TABLE account_cart_entry (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    client_id VARCHAR(250) NOT NULL,
    recipe_id BIGINT NOT NULL,
    recipe_title VARCHAR(300) NOT NULL,
    name VARCHAR(150) NOT NULL,
    amount VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    essential BOOLEAN NOT NULL,
    checked BOOLEAN NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 999),
    estimated_price INTEGER NOT NULL CHECK (estimated_price BETWEEN 0 AND 10000000),
    added_at BIGINT NOT NULL,
    CONSTRAINT uq_account_cart_entry UNIQUE(user_id, client_id)
);
CREATE TABLE cooking_diary (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    client_id VARCHAR(150) NOT NULL,
    recipe_id BIGINT NOT NULL,
    shorts_id BIGINT,
    recipe_title VARCHAR(300) NOT NULL,
    photo_url TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment VARCHAR(1000) NOT NULL,
    private_diary TEXT,
    created_at BIGINT NOT NULL,
    liked BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    streak_day INTEGER NOT NULL,
    CONSTRAINT uq_cooking_diary UNIQUE(user_id, client_id)
);
CREATE INDEX ix_cooking_diary_user_created ON cooking_diary(user_id, created_at DESC);
CREATE TABLE diary_progress (
    user_id BIGINT PRIMARY KEY REFERENCES users(id),
    total_xp INTEGER NOT NULL DEFAULT 0,
    last_login_date DATE,
    login_streak INTEGER NOT NULL DEFAULT 0,
    diary_xp_date DATE,
    diary_xp INTEGER NOT NULL DEFAULT 0
);
