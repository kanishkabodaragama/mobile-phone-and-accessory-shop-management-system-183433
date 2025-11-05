 /**
  * PUBLIC_INTERFACE
  * Supabase error utilities
  * Helpers to detect common Supabase error conditions and to normalize errors for UI use.
  */

 // PUBLIC_INTERFACE
 export function isTableMissingError(error) {
   /** This is a public function. Detects if a Supabase error means table is missing (42P01). */
   const msg = String(error?.message || '');
   return error?.code === '42P01' || /relation .* does not exist/i.test(msg) || /Could not find the table .* in the schema cache/i.test(msg);
 }

 // PUBLIC_INTERFACE
 export function isPolicyDeniedError(error) {
   /** This is a public function. Detects if RLS or permission denied blocked the operation. */
   const msg = String(error?.message || '');
   return error?.code === '42501' || /permission denied/i.test(msg) || /violates row-level security policy/i.test(msg);
 }

 // PUBLIC_INTERFACE
 export function normalizeError(err, fallback = 'Request failed') {
   /** This is a public function. Converts any error-like into a standard Error with message. */
   const msg = String(err?.message || err || fallback);
   return new Error(msg);
 }
