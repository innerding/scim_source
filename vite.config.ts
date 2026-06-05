import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    // shell-kit ist für Bundler (Vite) gebaut (extensionslose Re-Exports). Im Test
    // über Vite transformieren statt Node-ESM, sonst scheitert die Directory-Resolution.
    server: { deps: { inline: ['shell-kit'] } },
  },
})
