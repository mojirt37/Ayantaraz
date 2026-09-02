-- Additive publication guard. This intentionally aborts if legacy published rows
-- lack source and review evidence; repair must precede production deployment.
ALTER TABLE tax_rule_versions
  ADD CONSTRAINT tax_rule_versions_published_reviewed_source_check
  CHECK (
    status <> 'PUBLISHED'
    OR (
      btrim(source_reference) <> ''
      AND reviewed_at IS NOT NULL
      AND reviewed_by IS NOT NULL
    )
  );

ALTER TABLE knowledge_versions
  ADD CONSTRAINT knowledge_versions_published_reviewed_source_check
  CHECK (
    status <> 'PUBLISHED'
    OR (
      btrim(source_reference) <> ''
      AND reviewed_at IS NOT NULL
      AND reviewed_by IS NOT NULL
    )
  );
