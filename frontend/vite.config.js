import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request to /api/* from the frontend dev server is forwarded to
      // the FastAPI backend on 127.0.0.1:8000. This means the frontend can
      // call a relative path ("/api/...") instead of a hardcoded absolute
      // origin, so the browser never makes a cross-origin request in dev —
      // no CORS headers needed on the backend at all.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true, // proxy websocket connections too, in case any /api routes upgrade to ws
      },
    },
  },
})
