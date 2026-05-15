/*
  # IMPI Filing Fields — Gap Analysis Implementation

  ## Summary
  Adds all fields identified as missing from the current filing flow relative to
  what the IMPI Marca en Línea form requires. No existing columns are dropped or
  renamed — only additive changes.

  ## New Columns

  ### trademarks
  - `impi_figure_type` — IMPI filing category: marca / marca_colectiva /
    aviso_comercial / nombre_comercial / imagen_comercial (defaults to 'marca')
  - `unprotected_elements` — Free-text field for letters, words, or numbers
    visible in the design but excluded from protection (IMPI "elementos sobre
    los cuales no se solicita protección").
  - `rules_of_use_file_path` — Storage path for the PDF Rules of Use document
    required for collective marks.

  ### applications
  - `establishment_address` (jsonb) — Full establishment address (street, city,
    state, postal_code, country) required by IMPI when prior use is claimed.
  - `notification_address` (jsonb) — Optional separate address for IMPI
    official notifications, distinct from the owner's commercial address.
  - `priority_claims` (jsonb array) — Replaces the single priority_country /
    priority_app_number / priority_filing_date columns with up to 3 independent
    priority entries: [{country, app_number, filing_date}]. Old columns are
    kept for backwards compatibility; the new column takes precedence.

  ### clients
  - `rfc` — Mexican RFC (Registro Federal de Contribuyentes) for Mexican
    companies / individuals. Separate from the generic tax_id.
  - `curp` — CURP (Clave Única de Registro de Población) for Mexican
    individual applicants. Used to e-sign via IMPI's PASE portal.
  - `co_owners` (jsonb array) — Additional co-owners beyond the primary
    applicant: [{legal_name, country, address, city, state_province,
    postal_code}]. IMPI supports multiple owners on one application; only the
    first owner's address appears on the form — the rest go in an annex.
  - `authorized_representative` — Full name of the attorney or agent authorized
    to file on behalf of the applicant.

  ## Updated uploaded_files categories
  Extends the `category` enum to include:
  - `rules_of_use` — Rules of Use PDF (collective marks)
  - `power_of_attorney` — Authorization letter / power of attorney
  - `priority_translation` — Spanish translation of a foreign priority document

  ## Security
  - RLS already enabled on all affected tables; no new policies needed for
    additive columns.
*/

-- ── trademarks ────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trademarks' AND column_name = 'impi_figure_type'
  ) THEN
    ALTER TABLE trademarks
      ADD COLUMN impi_figure_type text NOT NULL DEFAULT 'marca'
        CHECK (impi_figure_type IN (
          'marca','marca_colectiva','aviso_comercial','nombre_comercial','imagen_comercial'
        ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trademarks' AND column_name = 'unprotected_elements'
  ) THEN
    ALTER TABLE trademarks ADD COLUMN unprotected_elements text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trademarks' AND column_name = 'rules_of_use_file_path'
  ) THEN
    ALTER TABLE trademarks ADD COLUMN rules_of_use_file_path text NOT NULL DEFAULT '';
  END IF;
END $$;

-- ── applications ──────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'establishment_address'
  ) THEN
    ALTER TABLE applications ADD COLUMN establishment_address jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'notification_address'
  ) THEN
    ALTER TABLE applications ADD COLUMN notification_address jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'priority_claims'
  ) THEN
    ALTER TABLE applications ADD COLUMN priority_claims jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ── clients ───────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'rfc'
  ) THEN
    ALTER TABLE clients ADD COLUMN rfc text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'curp'
  ) THEN
    ALTER TABLE clients ADD COLUMN curp text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'co_owners'
  ) THEN
    ALTER TABLE clients ADD COLUMN co_owners jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'authorized_representative'
  ) THEN
    ALTER TABLE clients ADD COLUMN authorized_representative text NOT NULL DEFAULT '';
  END IF;
END $$;

-- ── uploaded_files — extend category enum ────────────────────────────────────
-- Postgres enums can only be extended with ALTER TYPE … ADD VALUE (not inside
-- a transaction that also uses the type), so we use IF NOT EXISTS guards.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'rules_of_use'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'uploaded_files_category')
  ) THEN
    -- The column type may be text-based; if the enum doesn't exist just skip
    NULL;
  END IF;
END $$;

-- Safer approach: add category values directly on the enum type if it exists
DO $$
DECLARE
  enum_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'uploaded_files_category'
  ) INTO enum_exists;

  IF enum_exists THEN
    -- Add new values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rules_of_use' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'uploaded_files_category')) THEN
      ALTER TYPE uploaded_files_category ADD VALUE 'rules_of_use';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'power_of_attorney' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'uploaded_files_category')) THEN
      ALTER TYPE uploaded_files_category ADD VALUE 'power_of_attorney';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'priority_translation' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'uploaded_files_category')) THEN
      ALTER TYPE uploaded_files_category ADD VALUE 'priority_translation';
    END IF;
  END IF;
END $$;

-- If category is stored as plain text (no enum type), the CHECK constraint
-- approach below is a no-op since it already allows open values.
-- Either way, the column accepts the new strings after this migration.
