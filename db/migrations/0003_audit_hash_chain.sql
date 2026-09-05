-- Tamper-evident audit chain. Each entry commits to the previous entry's hash,
-- so silent modification or deletion of a historical row breaks verification.
-- Concurrent writers may fork from the same prev_hash; forks are detectable
-- and must be investigated, never silently merged.
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS prev_hash text,
  ADD COLUMN IF NOT EXISTS entry_hash text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);
