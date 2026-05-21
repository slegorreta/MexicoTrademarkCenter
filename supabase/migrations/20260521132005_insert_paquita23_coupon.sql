/*
  # Insert PAQUITA23 Discount Coupon

  Adds a 100% discount coupon code PAQUITA23 that grants a completely free
  order for both trademark filings and clearance reports.

  - code: PAQUITA23
  - discount_percent: 100
  - max_uses: NULL (unlimited)
  - expires_at: NULL (never expires)
  - active: true
*/

INSERT INTO public.coupons (code, discount_percent, description, max_uses, uses_count, active, expires_at)
VALUES (
  'PAQUITA23',
  100,
  'Internal 100% discount — full waiver for trademark filings and clearance reports',
  NULL,
  0,
  true,
  NULL
)
ON CONFLICT (code) DO UPDATE
  SET discount_percent = 100,
      active = true,
      expires_at = NULL,
      max_uses = NULL,
      description = 'Internal 100% discount — full waiver for trademark filings and clearance reports';
