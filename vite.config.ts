import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022'
  }
});
