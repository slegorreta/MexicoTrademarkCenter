/*
  # MexicoTrademarkCenter — Core Tables Migration

  ## Summary
  Creates the foundational database schema for MexicoTrademarkCenter.com.

  ## New Tables

  1. **profiles** — Extended user profiles linked to Supabase auth.users
     - role: super_admin | admin | docketing_staff | filing_staff | read_only | client
     - contact info, language preference

  2. **clients** — CRM client records (companies or individuals)
     - Legal name, country, contact details, WeChat/WhatsApp, language preference

  3. **applications** — Core trademark application records
     - Links client, tracks full lifecycle status
     - Internal case number, payment status, filing status

  4. **trademarks** — Trademark details per application
     - Mark name, type, language, translations, color claims

  5. **trademark_classes** — Selected Nice classification classes per application
     - Class number, goods/services description, status

  6. **goods_services** — Detailed goods/services descriptions
     - Original text, Spanish translation, admin review status

  7. **uploaded_files** — File metadata for logos, documents, certificates
     - Storage bucket path, MIME type, file size, category

  8. **payments** — Stripe payment records
     - Stripe session/payment IDs, amounts, status, refund info

  9. **docket_deadlines** — Trademark docketing calendar entries
     - All Mexican trademark lifecycle dates and deadlines
     - Priority, status, owner assignment

  10. **admin_notes** — Internal staff notes on applications

  11. **client_messages** — Staff-to-client and client-to-staff messages

  12. **email_templates** — Bilingual (EN/ZH) email templates

  13. **audit_logs** — Immutable audit trail for admin actions

  14. **settings** — Configurable system settings (pricing, fees, etc.)

  15. **nice_classes** — Reference table for all 45 Nice Classification classes

  ## Security
  - RLS enabled on all tables
  - Policies scoped by role using JWT app_metadata claims
  - Clients can only access their own records
  - Staff roles have appropriate read/write access
*/

-- ============================================================
-- NICE CLASSES (reference, no sensitive data)
-- ============================================================
CREATE TABLE IF NOT EXISTS nice_classes (
  id integer PRIMARY KEY,
  class_number integer UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('goods', 'services')),
  title_en text NOT NULL,
  title_zh text NOT NULL,
  description_en text NOT NULL,
  description_zh text NOT NULL,
  keywords text[] DEFAULT '{}',
  industries text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nice_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nice classes"
  ON nice_classes FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('super_admin','admin','docketing_staff','filing_staff','read_only','client')),
  preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en','zh','es')),
  phone text DEFAULT '',
  wechat text DEFAULT '',
  whatsapp text DEFAULT '',
  avatar_url text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin')
    )
  );

-- ============================================================
-- CLIENTS (CRM)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  applicant_type text NOT NULL DEFAULT 'company' CHECK (applicant_type IN ('individual','company')),
  legal_name text NOT NULL,
  country text NOT NULL DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  state_province text DEFAULT '',
  postal_code text DEFAULT '',
  email text NOT NULL,
  phone text DEFAULT '',
  wechat text DEFAULT '',
  whatsapp text DEFAULT '',
  tax_id text DEFAULT '',
  contact_person text DEFAULT '',
  preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en','zh','es')),
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own record"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

CREATE POLICY "Staff can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','filing_staff')
    )
  );

CREATE POLICY "Staff can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','filing_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','filing_staff')
    )
  );

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_staff_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  filing_status text NOT NULL DEFAULT 'new' CHECK (filing_status IN (
    'new','pending_review','pending_payment','info_requested',
    'classification_pending','ready_to_file','filed',
    'office_action_pending','office_action_responded',
    'published','opposed','registered','abandoned','closed'
  )),
  total_classes integer DEFAULT 0,
  service_fee_usd numeric(10,2) DEFAULT 0,
  government_fee_usd numeric(10,2) DEFAULT 0,
  total_amount_usd numeric(10,2) DEFAULT 0,
  priority_claimed boolean DEFAULT false,
  priority_country text DEFAULT '',
  priority_app_number text DEFAULT '',
  priority_filing_date date,
  impi_application_number text DEFAULT '',
  impi_filing_date date,
  impi_publication_date date,
  impi_registration_number text DEFAULT '',
  impi_registration_date date,
  impi_renewal_deadline date,
  internal_notes text DEFAULT '',
  admin_language text DEFAULT 'en',
  source text DEFAULT 'website',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

CREATE POLICY "Authenticated users can insert applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','filing_staff')
  ));

CREATE POLICY "Staff can update applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  );

-- ============================================================
-- TRADEMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS trademarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  mark_name text NOT NULL DEFAULT '',
  mark_type text NOT NULL DEFAULT 'word' CHECK (mark_type IN ('word','design','combined','three_dimensional','trade_name','slogan')),
  contains_non_spanish boolean DEFAULT false,
  mark_language text DEFAULT 'en',
  meaning_spanish text DEFAULT '',
  transliteration text DEFAULT '',
  mark_description text DEFAULT '',
  claims_color boolean DEFAULT false,
  color_description text DEFAULT '',
  logo_file_path text DEFAULT '',
  logo_preview_url text DEFAULT '',
  spanish_translation_status text DEFAULT 'pending' CHECK (spanish_translation_status IN ('pending','auto','reviewed','approved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trademarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own trademarks"
  ON trademarks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all trademarks"
  ON trademarks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

CREATE POLICY "Clients and staff can insert trademarks"
  ON trademarks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','filing_staff')
      ))
    )
  );

CREATE POLICY "Staff can update trademarks"
  ON trademarks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','filing_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','filing_staff')
    )
  );

-- ============================================================
-- TRADEMARK CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS trademark_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  class_number integer NOT NULL,
  class_title_en text NOT NULL DEFAULT '',
  class_title_zh text DEFAULT '',
  goods_services_en text DEFAULT '',
  goods_services_es text DEFAULT '',
  goods_services_zh text DEFAULT '',
  translation_status text DEFAULT 'pending' CHECK (translation_status IN ('pending','reviewed','approved')),
  classification_source text DEFAULT 'suggested' CHECK (classification_source IN ('suggested','user_selected','admin_override')),
  confidence_score numeric(3,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','filed','withdrawn')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trademark_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own trademark classes"
  ON trademark_classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view all trademark classes"
  ON trademark_classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

CREATE POLICY "Clients and staff can insert trademark classes"
  ON trademark_classes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','filing_staff')
      ))
    )
  );

CREATE POLICY "Staff can update trademark classes"
  ON trademark_classes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','filing_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','filing_staff')
    )
  );

-- ============================================================
-- GOODS SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS goods_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  description_original text NOT NULL DEFAULT '',
  original_language text DEFAULT 'en',
  description_spanish text DEFAULT '',
  translation_status text DEFAULT 'pending' CHECK (translation_status IN ('pending','auto','reviewed','approved')),
  business_industry text DEFAULT '',
  sales_channels text[] DEFAULT '{}',
  countries_sold text[] DEFAULT '{}',
  mexico_launch_status text DEFAULT 'planning' CHECK (mexico_launch_status IN ('selling','planning','manufacturing','defensive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goods_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own goods services"
  ON goods_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Staff can view all goods services"
  ON goods_services FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only'))
  );

CREATE POLICY "Clients and staff can insert goods services"
  ON goods_services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','filing_staff')
      )))
  );

CREATE POLICY "Staff can update goods services"
  ON goods_services FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','filing_staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','filing_staff')));

-- ============================================================
-- UPLOADED FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text DEFAULT '',
  file_size_bytes bigint DEFAULT 0,
  category text DEFAULT 'logo' CHECK (category IN ('logo','priority_doc','filing_receipt','registration_cert','office_action','other')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Staff can view all files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only'))
  );

CREATE POLICY "Authenticated users can insert files"
  ON uploaded_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND EXISTS (
      SELECT 1 FROM applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','filing_staff')
      ))
    )
  );

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  stripe_session_id text DEFAULT '',
  stripe_payment_intent_id text DEFAULT '',
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','partially_refunded')),
  refund_amount_usd numeric(10,2) DEFAULT 0,
  refund_reason text DEFAULT '',
  invoice_url text DEFAULT '',
  receipt_url text DEFAULT '',
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Staff can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only'))
  );

CREATE POLICY "System can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin')
      )))
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- ============================================================
-- DOCKET DEADLINES
-- ============================================================
CREATE TABLE IF NOT EXISTS docket_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  deadline_type text NOT NULL CHECK (deadline_type IN (
    'filing_target','impi_publication','opposition_deadline',
    'office_action_received','office_action_response',
    'registration_date','renewal_deadline',
    'declaration_of_use','custom'
  )),
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  due_date date NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  status text DEFAULT 'open' CHECK (status IN ('open','upcoming','due_soon','overdue','completed','cancelled')),
  reminder_30_sent boolean DEFAULT false,
  reminder_15_sent boolean DEFAULT false,
  reminder_7_sent boolean DEFAULT false,
  reminder_3_sent boolean DEFAULT false,
  reminder_1_sent boolean DEFAULT false,
  completed_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE docket_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all docket deadlines"
  ON docket_deadlines FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only'))
  );

CREATE POLICY "Staff can insert docket deadlines"
  ON docket_deadlines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff'))
  );

CREATE POLICY "Staff can update docket deadlines"
  ON docket_deadlines FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','docketing_staff','filing_staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin','docketing_staff','filing_staff')));

-- ============================================================
-- ADMIN NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  is_internal boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view admin notes"
  ON admin_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only'))
  );

CREATE POLICY "Staff can insert admin notes"
  ON admin_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  );

CREATE POLICY "Authors can update own notes"
  ON admin_notes FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- ============================================================
-- CLIENT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  sender_role text DEFAULT 'client',
  content text NOT NULL DEFAULT '',
  content_zh text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own messages"
  ON client_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Staff can view all messages"
  ON client_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only'))
  );

CREATE POLICY "Authenticated users can send messages"
  ON client_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM applications a WHERE a.id = application_id
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','docketing_staff','filing_staff')
      ))
    )
  );

-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name_en text NOT NULL DEFAULT '',
  subject_en text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  subject_zh text DEFAULT '',
  body_zh text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin'))
  );

CREATE POLICY "Admins can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin'))
  );

CREATE POLICY "Admins can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin'))
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL DEFAULT '',
  setting_type text DEFAULT 'string' CHECK (setting_type IN ('string','number','boolean','json')),
  description text DEFAULT '',
  is_public boolean DEFAULT false,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public settings are readable by all"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Admins can read all settings"
  ON settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin'))
  );

CREATE POLICY "Super admins can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','admin')));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_filing_status ON applications(filing_status);
CREATE INDEX IF NOT EXISTS idx_applications_payment_status ON applications(payment_status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trademark_classes_application_id ON trademark_classes(application_id);
CREATE INDEX IF NOT EXISTS idx_docket_deadlines_due_date ON docket_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_docket_deadlines_application_id ON docket_deadlines(application_id);
CREATE INDEX IF NOT EXISTS idx_docket_deadlines_status ON docket_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_payments_application_id ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_application_id ON client_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
