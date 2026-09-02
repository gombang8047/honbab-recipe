-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    profile_image_url VARCHAR(512),
    oauth_provider VARCHAR(20) NOT NULL,
    oauth_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. SHORTS
CREATE TABLE IF NOT EXISTS shorts (
    id BIGSERIAL PRIMARY KEY,
    youtube_id VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(512),
    video_url VARCHAR(512),
    duration_seconds INT,
    view_count BIGINT,
    metadata JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    crawled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. TAG
CREATE TABLE IF NOT EXISTS tag (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- SHORTS_TAG (Join Table)
CREATE TABLE IF NOT EXISTS shorts_tag (
    shorts_id BIGINT REFERENCES shorts(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (shorts_id, tag_id)
);

-- 4. USER_RECIPE_BOOKMARK
CREATE TABLE IF NOT EXISTS user_recipe_bookmark (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shorts_id BIGINT NOT NULL REFERENCES shorts(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_shorts_bookmark UNIQUE (user_id, shorts_id)
);

-- 5. RECIPE
CREATE TABLE IF NOT EXISTS recipe (
    id BIGSERIAL PRIMARY KEY,
    shorts_id BIGINT NOT NULL UNIQUE REFERENCES shorts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    serving_size INT DEFAULT 1,
    prep_time_minutes INT,
    cook_time_minutes INT,
    difficulty VARCHAR(20),
    estimated_cost INT,
    nutrition_info JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. RECIPE_STEP
CREATE TABLE IF NOT EXISTS recipe_step (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(512),
    timer_seconds INT
);

-- 7. INGREDIENT
CREATE TABLE IF NOT EXISTS ingredient (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    storage_type VARCHAR(30)
);

-- 8. RECIPE_INGREDIENT
CREATE TABLE IF NOT EXISTS recipe_ingredient (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
    amount VARCHAR(50),
    unit VARCHAR(20),
    is_essential BOOLEAN NOT NULL DEFAULT TRUE
);

-- 9. PRODUCT_MAPPING
CREATE TABLE IF NOT EXISTS product_mapping (
    id BIGSERIAL PRIMARY KEY,
    ingredient_id BIGINT NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
    platform VARCHAR(30) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_url VARCHAR(512),
    price INT NOT NULL,
    last_synced_at TIMESTAMP
);

-- 10. CART
CREATE TABLE IF NOT EXISTS cart (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. CART_ITEM
CREATE TABLE IF NOT EXISTS cart_item (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    product_mapping_id BIGINT NOT NULL REFERENCES product_mapping(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    price INT NOT NULL
);

-- 12. PAYMENT_HISTORY
CREATE TABLE IF NOT EXISTS payment_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(30) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    total_amount INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    kakao_tid VARCHAR(255)
);

-- 13. PAYMENT_ITEM
CREATE TABLE IF NOT EXISTS payment_item (
    id BIGSERIAL PRIMARY KEY,
    payment_history_id BIGINT NOT NULL REFERENCES payment_history(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price INT NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_shorts_created_at ON shorts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shorts_view_count ON shorts(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_shorts_id ON recipe(shorts_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_status ON cart(user_id, status);
