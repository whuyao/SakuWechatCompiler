import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve('electron/main.ts'),
        external: ['electron']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve('electron/preload.ts'),
        external: ['electron'],
        output: {
          format: 'cjs',
          entryFileNames: 'preload.cjs'
        }
      }
    }
  },
  renderer: {
    root: '.',
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve('index.html')
      }
    }
  }
})
