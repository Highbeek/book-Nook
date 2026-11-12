const ORIGINAL_ENV = process.env;

function loadEnv(vars: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL_ENV, ...vars };
  let env!: typeof import('../env').env;
  jest.isolateModules(() => {
    // env is read once at import time, so each case needs a fresh module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    env = require('../env').env;
  });
  return env;
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe('env', () => {
  it('falls back to the public Open Library hosts when nothing is set', () => {
    const env = loadEnv({ EXPO_PUBLIC_API_URL: undefined, EXPO_PUBLIC_COVERS_URL: '  ' });
    expect(env).toEqual({
      apiUrl: 'https://openlibrary.org',
      coversUrl: 'https://covers.openlibrary.org',
    });
  });

  it('uses the configured hosts and strips trailing slashes', () => {
    const env = loadEnv({
      EXPO_PUBLIC_API_URL: 'http://localhost:4000/',
      EXPO_PUBLIC_COVERS_URL: 'https://cdn.example.com//',
    });
    expect(env).toEqual({
      apiUrl: 'http://localhost:4000',
      coversUrl: 'https://cdn.example.com',
    });
  });
});
