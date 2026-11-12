function baseUrl(value: string | undefined, fallback: string): string {
  return (value?.trim() || fallback).replace(/\/+$/, '');
}

export const env = {
  apiUrl: baseUrl(process.env.EXPO_PUBLIC_API_URL, 'https://openlibrary.org'),
  coversUrl: baseUrl(process.env.EXPO_PUBLIC_COVERS_URL, 'https://covers.openlibrary.org'),
} as const;
