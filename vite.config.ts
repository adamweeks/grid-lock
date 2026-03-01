import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/grid-lock/' : '/',
  test: {
    environment: 'node',
  },
})
