export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  reverb: {
    host: 'localhost', // since Angular frontend runs on host browser
    port: 8080,
    scheme: 'http',
    key: 'family-connect-key', // must match .env
    path: '',
    cluster: 'mt1',
  },
};
