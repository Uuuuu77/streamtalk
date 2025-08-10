-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(50) PRIMARY KEY,
  streamer_id VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  max_speaking_time INTEGER DEFAULT 45,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Create queue_entries table
CREATE TABLE IF NOT EXISTS queue_entries (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(50) REFERENCES sessions(id),
  viewer_id VARCHAR(100) NOT NULL,
  viewer_name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  audio_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  selected_at TIMESTAMP,
  left_at TIMESTAMP
);

-- Create speaking_sessions table
CREATE TABLE IF NOT EXISTS speaking_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(50) REFERENCES sessions(id),
  viewer_id VARCHAR(100) NOT NULL,
  viewer_name VARCHAR(100) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  quality_rating INTEGER
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(50) REFERENCES sessions(id),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_session_status ON queue_entries(session_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_position ON queue_entries(position);
CREATE INDEX IF NOT EXISTS idx_speaking_sessions_session ON speaking_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
