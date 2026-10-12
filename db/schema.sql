-- Посты

CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(120)  NOT NULL CHECK (char_length(btrim(title)) >= 5),
  author      VARCHAR(50)   NOT NULL CHECK (char_length(btrim(author)) >= 2),
  category    VARCHAR(30)   NOT NULL,
  read_time   INTEGER       NOT NULL CHECK (read_time BETWEEN 1 AND 300),
  content     VARCHAR(5000) NOT NULL CHECK (char_length(btrim(content)) >= 20),
  views       INTEGER       NOT NULL DEFAULT 0 CHECK (views >= 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp()
);

-- Комментарии
CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author      VARCHAR(50)   NOT NULL CHECK (char_length(btrim(author)) >= 2),
  text        VARCHAR(1000) NOT NULL CHECK (char_length(btrim(text)) >= 3),
  rating      SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Журнал запросов
CREATE TABLE IF NOT EXISTS request_logs (
  id           SERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
  method       VARCHAR(10)   NOT NULL,
  url          VARCHAR(2048) NOT NULL,
  status       SMALLINT      NOT NULL,
  duration_ms  NUMERIC(10,1) NOT NULL CHECK (duration_ms >= 0),
  ip           VARCHAR(64),
  error        TEXT
);
