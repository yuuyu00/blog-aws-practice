import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Ensure environment variables are available at build time
    'process.env': {}
  },
  server: {
    port: 5000,
  },
  build: {
    // Optimize for Cloudflare Pages
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          apollo: ['@apollo/client', 'graphql'],
        },
      },
    },
  },
})
