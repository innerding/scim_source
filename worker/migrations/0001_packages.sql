CREATE TABLE IF NOT EXISTS packages (
  id           TEXT PRIMARY KEY,
  region_id    TEXT NOT NULL,
  version      TEXT NOT NULL,
  key          TEXT NOT NULL UNIQUE,
  cdn_url      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',
  package_id   TEXT NOT NULL,
  release_id   TEXT NOT NULL,
  note         TEXT,
  created_at   TEXT NOT NULL,
  activated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_packages_region_id ON packages (region_id);
CREATE INDEX IF NOT EXISTS idx_packages_status    ON packages (status);
