import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    // Disable Sentry in development
    __SENTRY_DEBUG__: false,
    __SENTRY_TRACING__: false,
  },
});
