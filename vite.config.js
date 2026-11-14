import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Pages serves the public site as static files. Keep the separate Sites build below.
    outDir: process.env.CF_PAGES === '1' ? 'dist' : 'tmp/hosting-client',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      ignored: [
        '**/dist/**',
        '**/output/**',
        '**/tmp/**',
        '**/live-comment-dashboard/**',
        '**/taobao-live-comment-recorder/**',
      ],
    },
  },
})
