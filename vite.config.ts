/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages project sites the app is served under /<repo>/, so the bundler
// must emit asset URLs with that prefix. CI sets BASE_PATH to "/<repo>/" (with
// trailing slash). Local dev and root-domain hosts use "/".
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
