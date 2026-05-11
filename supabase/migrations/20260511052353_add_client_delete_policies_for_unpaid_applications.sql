/*
  # Add client DELETE policies for unpaid application cleanup

  Clients need to be able to delete their own unpaid (pending_payment) cases
  and all associated child records. Without these policies, RLS silently blocks
  the delete operations even though the client owns the data.

  ## New DELETE policies

  - applications: clients can delete own applications where payment_status != 'paid'
  - trademark_classes: clients can delete classes on own applications
  - trademarks: clients can delete trademarks on own applications
  - goods_services: clients can delete goods/services on own applications
  - payments: clients can delete payments on own unpaid applications
  - timeline_events: clients can delete timeline events on own applications
  - client_messages: clients can delete messages on own applications
  - uploaded_files: clients can delete files on own applications

  ## Security notes
  - The applications policy is restricted to payment_status != 'paid' to
    prevent clients from deleting cases that have already been paid for.
  - Child table policies require the parent application to be owned by the
    client, preventing cross-user deletion.
*/

-- Applications: only allow deleting cases that have not been paid
CREATE POLICY "Clients can delete own unpaid applications"
  ON applications
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND payment_status != 'paid'
  );

-- trademark_classes
CREATE POLICY "Clients can delete own trademark classes"
  ON trademark_classes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = trademark_classes.application_id
        AND a.user_id = auth.uid()
    )
  );

-- trademarks
CREATE POLICY "Clients can delete own trademarks"
  ON trademarks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = trademarks.application_id
        AND a.user_id = auth.uid()
    )
  );

-- goods_services
CREATE POLICY "Clients can delete own goods services"
  ON goods_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = goods_services.application_id
        AND a.user_id = auth.uid()
    )
  );

-- payments: restrict to unpaid applications to avoid deleting payment records for paid cases
CREATE POLICY "Clients can delete payments on own unpaid applications"
  ON payments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = payments.application_id
        AND a.user_id = auth.uid()
        AND a.payment_status != 'paid'
    )
  );

-- timeline_events
CREATE POLICY "Clients can delete own timeline events"
  ON timeline_events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = timeline_events.application_id
        AND a.user_id = auth.uid()
    )
  );

-- client_messages
CREATE POLICY "Clients can delete own messages"
  ON client_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = client_messages.application_id
        AND a.user_id = auth.uid()
    )
  );

-- uploaded_files
CREATE POLICY "Clients can delete own uploaded files"
  ON uploaded_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = uploaded_files.application_id
        AND a.user_id = auth.uid()
    )
  );
