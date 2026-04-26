/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// For GitHub Pages project sites the app is served under /<repo>/, so the bundler
// must emit asset URLs with that prefix. CI sets BASE_PATH to "/<repo>/" (with
// trailing slash). Local dev and root-domain hosts use "/".
const base = process.env.BASE_PATH ?? '/'

// Replace __BUILD_ID__ in the copied dist/sw.js with a fresh, build-unique
// token. Without this the SW file would be byte-identical between deploys, the
// browser would never re-install it, and CACHE_VERSION would be frozen
// forever — defeating the whole point of versioned caches.
function injectSwBuildId(): Plugin {
  const buildId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  return {
    name: 'inject-sw-build-id',
    apply: 'build',
    closeBundle() {
      const swPath = resolve('dist', 'sw.js')
      if (!existsSync(swPath)) return
      const original = readFileSync(swPath, 'utf8')
      if (!original.includes('__BUILD_ID__')) return
      writeFileSync(swPath, original.replaceAll('__BUILD_ID__', buildId))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), injectSwBuildId()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
