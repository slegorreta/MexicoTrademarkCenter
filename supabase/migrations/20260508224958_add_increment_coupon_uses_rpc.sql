/*
  # Add increment_coupon_uses RPC function

  Atomically increments the uses_count on a coupon row.
  Called by the create-payment-intent edge function after a successful
  PaymentIntent creation to prevent race conditions on concurrent redemptions.
*/

CREATE OR REPLACE FUNCTION increment_coupon_uses(coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET uses_count = uses_count + 1
  WHERE id = coupon_id;
END;
$$;
