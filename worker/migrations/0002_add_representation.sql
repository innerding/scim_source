ALTER TABLE packages ADD COLUMN representation_id TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_packages_representation_id ON packages (representation_id);
