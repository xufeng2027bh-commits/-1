import { defineConfig } from 'vite'

export default defineConfig({
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
