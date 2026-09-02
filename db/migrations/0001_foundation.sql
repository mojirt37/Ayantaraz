-- Foundation schema. PostgreSQL is the authoritative store.
-- This migration creates only requirements-backed entities and constraints.
-- It does not encode unresolved tax, availability, cancellation, payment-evidence, or retention policies.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE version_status AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE appointment_status AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
CREATE TYPE content_status AS ENUM ('DRAFT', 'PREVIEW', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 varchar(16) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'USER',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (phone_e164 ~ '^\\+[1-9][0-9]{7,14}$')
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE INDEX sessions_active_user_idx ON sessions (user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 varchar(16) NOT NULL,
  code_hmac text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE INDEX otp_challenges_active_phone_idx ON otp_challenges (phone_e164, expires_at) WHERE consumed_at IS NULL;

CREATE TABLE consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Service catalog, duration, availability, capacity and slot generation are owner decisions (B-002).
CREATE TABLE appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  UNIQUE (starts_at, ends_at)
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL UNIQUE REFERENCES appointment_slots(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  consultation_id uuid REFERENCES consultations(id) ON DELETE SET NULL,
  status appointment_status NOT NULL DEFAULT 'REQUESTED',
  idempotency_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX appointments_user_created_idx ON appointments (user_id, created_at DESC);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  status payment_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  CHECK (
    (status = 'PENDING' AND decided_at IS NULL AND decided_by IS NULL)
    OR (status IN ('CONFIRMED', 'REJECTED') AND decided_at IS NOT NULL AND decided_by IS NOT NULL)
  )
);
CREATE UNIQUE INDEX payments_pending_appointment_idx ON payments (appointment_id) WHERE status = 'PENDING';

CREATE TABLE tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tax_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_rule_id uuid NOT NULL REFERENCES tax_rules(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK (version > 0),
  status version_status NOT NULL DEFAULT 'DRAFT',
  source_reference text NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  published_at timestamptz,
  executable_definition jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL)),
  UNIQUE (tax_rule_id, version)
);
CREATE UNIQUE INDEX tax_rule_published_effective_idx ON tax_rule_versions (tax_rule_id, effective_from) WHERE status = 'PUBLISHED';

CREATE TABLE tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tax_rule_version_id uuid NOT NULL REFERENCES tax_rule_versions(id) ON DELETE RESTRICT,
  engine_version text NOT NULL,
  effective_date date NOT NULL,
  input_snapshot jsonb NOT NULL,
  output_snapshot jsonb NOT NULL,
  disclaimer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tax_calculations_user_created_idx ON tax_calculations (user_id, created_at DESC);

CREATE TABLE knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE knowledge_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_article_id uuid NOT NULL REFERENCES knowledge_articles(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK (version > 0),
  status version_status NOT NULL DEFAULT 'DRAFT',
  source_reference text NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  published_at timestamptz,
  decision_tree jsonb NOT NULL,
  answer_content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL)),
  UNIQUE (knowledge_article_id, version)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE FUNCTION enforce_appointment_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (OLD.status = 'REQUESTED' AND NEW.status IN ('CONFIRMED', 'CANCELLED'))
    OR (OLD.status = 'CONFIRMED' AND NEW.status IN ('COMPLETED', 'CANCELLED')) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid appointment transition from % to %', OLD.status, NEW.status USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER appointments_transition_guard BEFORE UPDATE OF status ON appointments
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_appointment_transition();

CREATE FUNCTION enforce_payment_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'PENDING' AND NEW.status IN ('CONFIRMED', 'REJECTED') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid payment transition from % to %', OLD.status, NEW.status USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER payments_transition_guard BEFORE UPDATE OF status ON payments
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_payment_transition();

CREATE FUNCTION enforce_version_transition_and_immutability() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'PUBLISHED' AND NEW.status <> 'ARCHIVED' THEN
    RAISE EXCEPTION 'published versions may only be archived' USING ERRCODE = '23514';
  END IF;
  IF OLD.status = 'PUBLISHED' AND NEW.status = 'ARCHIVED'
    AND (NEW.tax_rule_id, NEW.version, NEW.source_reference, NEW.effective_from, NEW.effective_to,
         NEW.reviewed_at, NEW.reviewed_by, NEW.published_at, NEW.executable_definition, NEW.created_at)
      IS DISTINCT FROM (OLD.tax_rule_id, OLD.version, OLD.source_reference, OLD.effective_from, OLD.effective_to,
                        OLD.reviewed_at, OLD.reviewed_by, OLD.published_at, OLD.executable_definition, OLD.created_at) THEN
    RAISE EXCEPTION 'published tax rule definitions are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tax_rule_versions_immutable_guard BEFORE UPDATE ON tax_rule_versions
  FOR EACH ROW EXECUTE FUNCTION enforce_version_transition_and_immutability();

CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size > 0),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status content_status NOT NULL DEFAULT 'DRAFT',
  title text NOT NULL,
  summary text NOT NULL,
  body jsonb NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL))
);

CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status content_status NOT NULL DEFAULT 'DRAFT',
  title text NOT NULL,
  description text NOT NULL,
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL))
);

CREATE TABLE mini_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  status content_status NOT NULL DEFAULT 'DRAFT',
  title text NOT NULL,
  description text NOT NULL,
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL))
);

CREATE TABLE homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  content jsonb NOT NULL,
  status content_status NOT NULL DEFAULT 'DRAFT',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL))
);

CREATE TABLE homepage_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_order integer NOT NULL CHECK (display_order >= 0),
  image_media_id uuid NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text NOT NULL,
  link_path text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (display_order)
);
CREATE FUNCTION enforce_version_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  IF (OLD.status = 'DRAFT' AND NEW.status = 'REVIEW')
    OR (OLD.status = 'REVIEW' AND NEW.status = 'APPROVED')
    OR (OLD.status = 'APPROVED' AND NEW.status = 'PUBLISHED')
    OR (OLD.status = 'PUBLISHED' AND NEW.status = 'ARCHIVED') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid version transition from % to %', OLD.status, NEW.status USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER tax_rule_versions_lifecycle_guard BEFORE UPDATE OF status ON tax_rule_versions
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_version_lifecycle();
CREATE TRIGGER knowledge_versions_lifecycle_guard BEFORE UPDATE OF status ON knowledge_versions
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_version_lifecycle();

CREATE FUNCTION enforce_knowledge_immutability() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'PUBLISHED' AND NEW.status <> 'ARCHIVED' THEN
    RAISE EXCEPTION 'published knowledge versions may only be archived' USING ERRCODE = '23514';
  END IF;
  IF OLD.status = 'PUBLISHED' AND NEW.status = 'ARCHIVED'
    AND (NEW.knowledge_article_id, NEW.version, NEW.source_reference, NEW.effective_from, NEW.effective_to,
         NEW.reviewed_at, NEW.reviewed_by, NEW.published_at, NEW.decision_tree, NEW.answer_content, NEW.created_at)
      IS DISTINCT FROM (OLD.knowledge_article_id, OLD.version, OLD.source_reference, OLD.effective_from, OLD.effective_to,
                        OLD.reviewed_at, OLD.reviewed_by, OLD.published_at, OLD.decision_tree, OLD.answer_content, OLD.created_at) THEN
    RAISE EXCEPTION 'published knowledge definitions are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER knowledge_versions_immutable_guard BEFORE UPDATE ON knowledge_versions
  FOR EACH ROW EXECUTE FUNCTION enforce_knowledge_immutability();

CREATE FUNCTION enforce_content_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  IF (OLD.status = 'DRAFT' AND NEW.status = 'PREVIEW')
    OR (OLD.status = 'PREVIEW' AND NEW.status = 'PUBLISHED')
    OR (OLD.status = 'PUBLISHED' AND NEW.status = 'ARCHIVED') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'invalid content transition from % to %', OLD.status, NEW.status USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER articles_lifecycle_guard BEFORE UPDATE OF status ON articles
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_content_lifecycle();
CREATE TRIGGER videos_lifecycle_guard BEFORE UPDATE OF status ON videos
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_content_lifecycle();
CREATE TRIGGER mini_books_lifecycle_guard BEFORE UPDATE OF status ON mini_books
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_content_lifecycle();
CREATE TRIGGER homepage_sections_lifecycle_guard BEFORE UPDATE OF status ON homepage_sections
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION enforce_content_lifecycle();
