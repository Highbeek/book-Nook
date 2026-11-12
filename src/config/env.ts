/**
 * Public runtime config. Expo inlines `EXPO_PUBLIC_*` variables at build time, and only when
 * they are read with dot access, so keep these as plain `process.env.EXPO_PUBLIC_X` reads.
 * Values are visible in the shipped bundle: never put secrets here.
 * The fallbacks keep the app (and Jest, which doesn't load .env) working without a .env file.
 */
function baseUrl(value: string | undefined, fallback: string): string {
  return (value?.trim() || fallback).replace(/\/+$/, '');
}

export const env = {
  apiUrl: baseUrl(process.env.EXPO_PUBLIC_API_URL, 'https://openlibrary.org'),
  coversUrl: baseUrl(process.env.EXPO_PUBLIC_COVERS_URL, 'https://covers.openlibrary.org'),
} as const;
