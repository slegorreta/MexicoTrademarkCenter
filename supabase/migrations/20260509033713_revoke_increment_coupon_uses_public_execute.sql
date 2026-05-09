/*
  # Restrict increment_coupon_uses to service_role only

  The increment_coupon_uses function is SECURITY DEFINER and should only be
  callable by the service_role (used by edge functions). Revoking EXECUTE from
  anon and authenticated prevents public abuse via the REST API.
*/

REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(uuid) FROM authenticated;
