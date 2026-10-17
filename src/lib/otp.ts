/**
 * Expected email OTP lengths per flow.
 *
 * WARNING: Supabase has ONE project-wide "Email OTP Length" setting
 * (Dashboard -> Authentication -> Providers/Email; 6-10 digits). It applies to
 * signup AND recovery emails. These constants only control the UI and the
 * client-side check, so they must equal the value set in Supabase.
 */
export const SIGNUP_OTP_LENGTH = 6;
export const RESET_OTP_LENGTH = 6;
