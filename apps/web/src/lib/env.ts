export const env = {
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  VITE_WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Mino-Chat',
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.0.0',
};