import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Never inject GEMINI_API_KEY into the client bundle — keys stay on the Node server only.
  const geminiModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const port = Number(process.env.PORT || env.PORT || 1110);
  const appUrl =
    env.ENV_URL ||
    process.env.ENV_URL ||
    env.APP_URL ||
    process.env.APP_URL ||
    `http://localhost:${port}`;
  const gcpProject = env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
  const gcpRegion = env.GOOGLE_CLOUD_REGION || process.env.GOOGLE_CLOUD_REGION || 'europe-west1';
  const gcsBucket = env.GCS_BUCKET_NAME || env.GCS_DEFAULT_BUCKET || '';
  const gcsUri = env.GCS_BUCKET_URI || (gcsBucket ? `gs://${gcsBucket}/` : '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(''),
      'process.env.GOOGLE_GENAI_API_KEY': JSON.stringify(''),
      'process.env.GEMINI_MODEL': JSON.stringify(geminiModel),
      'process.env.ENV_URL': JSON.stringify(appUrl),
      'process.env.APP_URL': JSON.stringify(appUrl),
      'process.env.PORT': JSON.stringify(port),
      'process.env.GOOGLE_CLOUD_PROJECT': JSON.stringify(gcpProject),
      'process.env.GOOGLE_CLOUD_REGION': JSON.stringify(gcpRegion),
      'process.env.GCS_BUCKET_NAME': JSON.stringify(gcsBucket),
      'process.env.GCS_BUCKET_URI': JSON.stringify(gcsUri),
    },
    server: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          // Docker compose serves API+UI on :1110; local `node server.js` defaults to :8080.
          target: process.env.API_TARGET || 'http://127.0.0.1:1110',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
