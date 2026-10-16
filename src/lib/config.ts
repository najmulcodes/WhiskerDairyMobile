// Central runtime config. Expo inlines EXPO_PUBLIC_* values at build time and
// ONLY when they are accessed as literal `process.env.EXPO_PUBLIC_X` — do not
// refactor these into dynamic lookups.

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

export const API_URL = clean(process.env.EXPO_PUBLIC_API_URL).replace(/\/+$/, '');
export const SUPABASE_URL = clean(process.env.EXPO_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
export const CLOUDINARY_CLOUD_NAME = clean(process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME);
export const CLOUDINARY_UPLOAD_PRESET = clean(process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
export const PRIVACY_POLICY_URL = clean(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL);

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname.length > 0;
  } catch {
    return false;
  }
}

/** Names (never values) of required settings that are missing or invalid. */
export function getMissingConfig(): string[] {
  const missing: string[] = [];
  if (!isHttpsUrl(API_URL)) missing.push('EXPO_PUBLIC_API_URL');
  if (!isHttpsUrl(SUPABASE_URL)) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!CLOUDINARY_CLOUD_NAME) missing.push('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME');
  if (!CLOUDINARY_UPLOAD_PRESET) missing.push('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  if (!isHttpsUrl(PRIVACY_POLICY_URL)) missing.push('EXPO_PUBLIC_PRIVACY_POLICY_URL');
  return missing;
}
