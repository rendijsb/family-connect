export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  reverb: {
    host: 'localhost', // External host for browser access
    port: 8080,
    scheme: 'http',
    key: 'family-connect-key',
    path: '', // Important: keep empty for Reverb
    cluster: 'mt1',
  },
};
