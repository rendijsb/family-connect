export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  reverb: {
    host: 'localhost',
    port: 8080,
    scheme: 'http', // or 'https' for production
    key: 'family-connect-key', // Should match REVERB_APP_KEY in .env
    path: '',
    cluster: 'mt1',
  },
};
