#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=5432}"
: "${PGUSER:=ayan_taraz}"
: "${PGPASSWORD:=ayan_taraz_test_password}"
: "${PGDATABASE:=ayan_taraz_test}"
: "${POSTGRES_CLIENT_IMAGE:=postgres:18.1-alpine}"

psql() {
  docker run --rm --network host -i \
    -e PGPASSWORD="$PGPASSWORD" \
    "$POSTGRES_CLIENT_IMAGE" \
    psql --set=ON_ERROR_STOP=1 --no-psqlrc --tuples-only \
      --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$PGDATABASE" "$@"
}

for migration in db/migrations/*.sql; do
  psql < "$migration"
done

extension=$(psql --command "SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';")
test "$(echo "$extension" | xargs)" = "pgcrypto"

psql --command "TRUNCATE appointments, appointment_slots, users CASCADE;"
psql --command "
  INSERT INTO users (id, phone_e164) VALUES
    ('00000000-0000-0000-0000-000000000001', '+989121234567'),
    ('00000000-0000-0000-0000-000000000002', '+989111111111');
  INSERT INTO appointment_slots (id, starts_at, ends_at) VALUES
    ('10000000-0000-0000-0000-000000000001', '2026-10-01T09:00:00Z', '2026-10-01T10:00:00Z');
"

insert_reservation() {
  local user_id="$1"
  local key="$2"
  psql --command "
    INSERT INTO appointments (slot_id, user_id, idempotency_key) VALUES
      ('10000000-0000-0000-0000-000000000001', '$user_id', '$key');
  "
}

set +e
insert_reservation "00000000-0000-0000-0000-000000000001" "20000000-0000-0000-0000-000000000001" &
first_pid=$!
insert_reservation "00000000-0000-0000-0000-000000000002" "20000000-0000-0000-0000-000000000002" &
second_pid=$!
wait "$first_pid"; first_status=$?
wait "$second_pid"; second_status=$?
set -e

successes=0
test "$first_status" -eq 0 && successes=$((successes + 1))
test "$second_status" -eq 0 && successes=$((successes + 1))
test "$successes" -eq 1

bookings=$(psql --command "SELECT count(*) FROM appointments WHERE slot_id = '10000000-0000-0000-0000-000000000001';")
test "$(echo "$bookings" | xargs)" = "1"

psql --command "
  INSERT INTO tax_rules (id, stable_key) VALUES
    ('30000000-0000-0000-0000-000000000001', 'test-income-tax');
  INSERT INTO tax_rule_versions (
    id, tax_rule_id, version, source_reference, effective_from, executable_definition
  ) VALUES (
    '30000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    1,
    'test-source-reference',
    '2026-01-01',
    '{}'::jsonb
  );
  UPDATE tax_rule_versions SET status = 'REVIEW'
    WHERE id = '30000000-0000-0000-0000-000000000002';
  UPDATE tax_rule_versions SET status = 'APPROVED'
    WHERE id = '30000000-0000-0000-0000-000000000002';
"

if psql --command "
  UPDATE tax_rule_versions SET status = 'PUBLISHED', published_at = now()
    WHERE id = '30000000-0000-0000-0000-000000000002';
"; then
  echo "A tax rule version published without review metadata." >&2
  exit 1
fi

psql --command "
  UPDATE tax_rule_versions
    SET reviewed_at = now(), reviewed_by = '00000000-0000-0000-0000-000000000001'
    WHERE id = '30000000-0000-0000-0000-000000000002';
  UPDATE tax_rule_versions SET status = 'PUBLISHED', published_at = now()
    WHERE id = '30000000-0000-0000-0000-000000000002';
"

published_rules=$(psql --command "SELECT count(*) FROM tax_rule_versions WHERE status = 'PUBLISHED';")
test "$(echo "$published_rules" | xargs)" = "1"

psql --command "
  INSERT INTO knowledge_articles (id, stable_key) VALUES
    ('40000000-0000-0000-0000-000000000001', 'test-knowledge');
  INSERT INTO knowledge_versions (
    id, knowledge_article_id, version, source_reference, effective_from, decision_tree, answer_content
  ) VALUES (
    '40000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    1,
    'test-source-reference',
    '2026-01-01',
    '{}'::jsonb,
    '{}'::jsonb
  );
  UPDATE knowledge_versions SET status = 'REVIEW'
    WHERE id = '40000000-0000-0000-0000-000000000002';
  UPDATE knowledge_versions SET status = 'APPROVED'
    WHERE id = '40000000-0000-0000-0000-000000000002';
"

if psql --command "
  UPDATE knowledge_versions SET status = 'PUBLISHED', published_at = now()
    WHERE id = '40000000-0000-0000-0000-000000000002';
"; then
  echo "A knowledge version published without review metadata." >&2
  exit 1
fi

psql --command "
  UPDATE knowledge_versions
    SET reviewed_at = now(), reviewed_by = '00000000-0000-0000-0000-000000000001'
    WHERE id = '40000000-0000-0000-0000-000000000002';
  UPDATE knowledge_versions SET status = 'PUBLISHED', published_at = now()
    WHERE id = '40000000-0000-0000-0000-000000000002';
"

published_knowledge=$(psql --command "SELECT count(*) FROM knowledge_versions WHERE status = 'PUBLISHED';")
test "$(echo "$published_knowledge" | xargs)" = "1"

echo "PostgreSQL migration, appointment concurrency, and tax/knowledge publication controls passed."
