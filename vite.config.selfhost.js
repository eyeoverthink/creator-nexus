// Self-hosted build: no Base44 Vite plugin, and '@base44/sdk' resolves to our own client shim.
//   npm run build:selfhost   (output: dist/)
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const appUrl = (process.env.VITE_CREATOR_NEXUS_URL || '').replace(/\/$/, '')
// Hard-coded Base44 app URLs in the UI (copy-paste snippets, links) point at this server instead.
const rewriteBase44Urls = () => ({
  name: 'selfhost-rewrite-base44-urls',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('node_modules') || !/\.(jsx?|tsx?)$/.test(id) || !code.includes('creator-nexus.base44.app')) return null
    return { code: code.replaceAll('https://creator-nexus.base44.app', appUrl || ''), map: null }
  },
})

export default defineConfig({
  plugins: [rewriteBase44Urls(), react()],
  resolve: {
    alias: [
      { find: /^@base44\/sdk$/, replacement: path.resolve(__dirname, 'src/api/selfhostSdk.js') },
      { find: /^@\//, replacement: path.resolve(__dirname, 'src') + '/' },
    ],
  },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 4000 },
})
