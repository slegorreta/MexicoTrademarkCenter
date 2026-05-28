import { supabase } from './supabase';

export type ConversionEvent =
  | 'report_viewed'
  | 'report_emailed'
  | 'report_cta_clicked'
  | 'attorney_review_requested'
  | 'payment_started'
  | 'payment_succeeded';

export async function trackEvent(
  event: ConversionEvent,
  properties?: Record<string, unknown>,
  language?: string,
  orderRef?: string,
): Promise<void> {
  try {
    await supabase.from('conversion_events').insert({
      event,
      properties: properties ?? null,
      language: language ?? null,
      order_ref: orderRef ? orderRef.slice(0, 8) : null,
    });
  } catch {
    // Never block UI on analytics failure
  }
}
