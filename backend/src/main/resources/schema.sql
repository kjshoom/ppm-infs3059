CREATE TABLE IF NOT EXISTS ppm_users (
  id UUID PRIMARY KEY,
  display_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  workspace_role VARCHAR(40) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS ppm_login_sessions (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES ppm_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS ppm_login_sessions_user_id_idx ON ppm_login_sessions(user_id);
CREATE INDEX IF NOT EXISTS ppm_login_sessions_expires_at_idx ON ppm_login_sessions(expires_at);
