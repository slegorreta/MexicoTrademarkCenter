/*
  # Fix RLS infinite recursion across all tables

  Every staff/admin policy does:
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = ...)

  When Postgres evaluates that subquery it applies the profiles RLS policies,
  which themselves query profiles → infinite recursion → HTTP 500 on every
  protected table.

  Fix: drop every policy that references profiles and recreate it using
  get_my_profile_role() (SECURITY DEFINER, already created in prior migration).
*/

-- ─── admin_notes ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can insert admin notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Staff can view admin notes" ON public.admin_notes;

CREATE POLICY "Staff can insert admin notes"
  ON public.admin_notes FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff'])
  );

CREATE POLICY "Staff can view admin notes"
  ON public.admin_notes FOR SELECT TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only'])
  );

-- ─── applications ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can update applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can view all applications" ON public.applications;

CREATE POLICY "Authenticated users can insert applications"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff'])
  );

CREATE POLICY "Staff can update applications"
  ON public.applications FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']));

CREATE POLICY "Staff can view all applications"
  ON public.applications FOR SELECT TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only'])
  );

-- ─── audit_logs ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin']));

-- ─── client_messages ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.client_messages;
DROP POLICY IF EXISTS "Staff can view all messages" ON public.client_messages;

CREATE POLICY "Authenticated users can send messages"
  ON public.client_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = client_messages.application_id AND a.user_id = auth.uid()
      )
      OR get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff'])
    )
  );

CREATE POLICY "Staff can view all messages"
  ON public.client_messages FOR SELECT TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only'])
  );

-- ─── coupons ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can view coupons" ON public.coupons;

CREATE POLICY "Staff can view coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff'])
  );

-- ─── docket_deadlines ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can insert docket deadlines" ON public.docket_deadlines;
DROP POLICY IF EXISTS "Staff can update docket deadlines" ON public.docket_deadlines;
DROP POLICY IF EXISTS "Staff can view all docket deadlines" ON public.docket_deadlines;

CREATE POLICY "Staff can insert docket deadlines"
  ON public.docket_deadlines FOR INSERT TO authenticated
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']));

CREATE POLICY "Staff can update docket deadlines"
  ON public.docket_deadlines FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']));

CREATE POLICY "Staff can view all docket deadlines"
  ON public.docket_deadlines FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));

-- ─── email_log ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can view all email logs" ON public.email_log;

CREATE POLICY "Staff can view all email logs"
  ON public.email_log FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));

-- ─── email_templates ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can insert email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can update email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can view email templates" ON public.email_templates;

CREATE POLICY "Admins can insert email templates"
  ON public.email_templates FOR INSERT TO authenticated
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin']));

CREATE POLICY "Admins can update email templates"
  ON public.email_templates FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin']));

CREATE POLICY "Admins can view email templates"
  ON public.email_templates FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin']));

-- ─── goods_services ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Clients and staff can insert goods services" ON public.goods_services;
DROP POLICY IF EXISTS "Staff can update goods services" ON public.goods_services;
DROP POLICY IF EXISTS "Staff can view all goods services" ON public.goods_services;

CREATE POLICY "Clients and staff can insert goods services"
  ON public.goods_services FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = goods_services.application_id AND a.user_id = auth.uid()
    )
    OR get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff'])
  );

CREATE POLICY "Staff can update goods services"
  ON public.goods_services FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff']));

CREATE POLICY "Staff can view all goods services"
  ON public.goods_services FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));

-- ─── payments ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
DROP POLICY IF EXISTS "Staff can view all payments" ON public.payments;
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;

CREATE POLICY "System can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = payments.application_id AND a.user_id = auth.uid()
    )
    OR get_my_profile_role() = ANY (ARRAY['super_admin','admin'])
  );

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin']));

CREATE POLICY "Staff can view all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));

-- ─── settings ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Super admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can read all settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;

CREATE POLICY "Super admins can insert settings"
  ON public.settings FOR INSERT TO authenticated
  WITH CHECK (get_my_profile_role() = 'super_admin');

CREATE POLICY "Admins can read all settings"
  ON public.settings FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin']));

CREATE POLICY "Admins can update settings"
  ON public.settings FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin']));

-- ─── staff_payment_links ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can insert payment links" ON public.staff_payment_links;
DROP POLICY IF EXISTS "Staff can update payment links" ON public.staff_payment_links;
DROP POLICY IF EXISTS "Staff can view payment links" ON public.staff_payment_links;

CREATE POLICY "Staff can insert payment links"
  ON public.staff_payment_links FOR INSERT TO authenticated
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']));

CREATE POLICY "Staff can update payment links"
  ON public.staff_payment_links FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']));

CREATE POLICY "Staff can view payment links"
  ON public.staff_payment_links FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));

-- ─── timeline_events ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can insert timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Staff can update timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Staff can view all timeline events" ON public.timeline_events;

CREATE POLICY "Staff can insert timeline events"
  ON public.timeline_events FOR INSERT TO authenticated
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']));

CREATE POLICY "Staff can update timeline events"
  ON public.timeline_events FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff']));

CREATE POLICY "Staff can view all timeline events"
  ON public.timeline_events FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));

-- ─── trademark_classes ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Clients and staff can insert trademark classes" ON public.trademark_classes;
DROP POLICY IF EXISTS "Staff can update trademark classes" ON public.trademark_classes;
DROP POLICY IF EXISTS "Staff can view all trademark classes" ON public.trademark_classes;

CREATE POLICY "Clients and staff can insert trademark classes"
  ON public.trademark_classes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = trademark_classes.application_id AND a.user_id = auth.uid()
    )
    OR get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff'])
  );

CREATE POLICY "Staff can update trademark classes"
  ON public.trademark_classes FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff']));

CREATE POLICY "Staff can view all trademark classes"
  ON public.trademark_classes FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));

-- ─── trademarks ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Clients and staff can insert trademarks" ON public.trademarks;
DROP POLICY IF EXISTS "Staff can update trademarks" ON public.trademarks;
DROP POLICY IF EXISTS "Staff can view all trademarks" ON public.trademarks;

CREATE POLICY "Clients and staff can insert trademarks"
  ON public.trademarks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = trademarks.application_id AND a.user_id = auth.uid()
    )
    OR get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff'])
  );

CREATE POLICY "Staff can update trademarks"
  ON public.trademarks FOR UPDATE TO authenticated
  USING    (get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff']))
  WITH CHECK (get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff']));

CREATE POLICY "Staff can view all trademarks"
  ON public.trademarks FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));

-- ─── uploaded_files ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can insert files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Clients can view their visible files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Staff can view all files" ON public.uploaded_files;

CREATE POLICY "Authenticated users can insert files"
  ON public.uploaded_files FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM applications a
        WHERE a.id = uploaded_files.application_id AND a.user_id = auth.uid()
      )
      OR get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff'])
    )
  );

CREATE POLICY "Clients can view their visible files"
  ON public.uploaded_files FOR SELECT TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only'])
    OR (
      visible_to_client = true
      AND EXISTS (
        SELECT 1 FROM applications
        WHERE applications.id = uploaded_files.application_id
          AND applications.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Staff can view all files"
  ON public.uploaded_files FOR SELECT TO authenticated
  USING (get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only']));
