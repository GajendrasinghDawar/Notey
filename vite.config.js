import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { URL, fileURLToPath } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

/** @type {import('vite').UserConfig} */
export default defineConfig({

  esbuild: {
    // jsxInject: `import React from 'react'`,
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      // This setting handles the update flow. 'autoUpdate' will refresh the
      // page as soon as a new version of the app is available.
      registerType: 'autoUpdate',

      // This section configures the service worker generation.
      workbox: { maximumFileSizeToCacheInBytes: 10485760,
        // This ensures that all assets (JS, CSS, images, etc.) in your build
        // output are precached, providing full offline support.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,woff,woff2}'],
        // Import the share target handler into the generated service worker.
        importScripts: ['/share_target_handler.js'],
      },
      devOptions: {
        enabled: true,
      },
      // The 'manifest' object is used to generate the manifest.json file.
      // This file is crucial for the "Add to Home Screen" or install prompt.
      manifest: {
        name: 'Note Keeper',
        short_name: 'Notekeeper',
        start_url: '/',
        theme_color: '#94ce9a',
        background_color: '#94ce9a',
        display: 'standalone',
        scope: './',
        file_handlers: [
          {
            action: '/viewer',
            accept: {
              'text/markdown': ['.md', '.markdown', '.mdx', '.mdown'],
            },
          },
        ],
        share_target: {
          action: '/viewer',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'file',
                accept: ['text/markdown', '.md'],
              },
            ],
          },
        },
        icons: [
          {
            src: '/icons/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-icon-rounded-1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-icon-1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        description: 'This app lets you add notes. It works offline and is installable, give it a try!',
        screenshots: [
          {
            src: '/screenshots/homepage.png',
            sizes: '1366x625',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Note Keeper',
          },
          {
            src: '/screenshots/listpage.png',
            sizes: '320x480',
            type: 'image/png',
          },
          {
            src: '/screenshots/homepage-mobile.png',
            sizes: '360x625',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: '/screenshots/createpage.png',
            sizes: '1366x625',
            type: 'image/png',
          },
          {
            src: '/screenshots/showpage.png',
            sizes: '1366x625',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Customize the output filenames
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
    },
  },
})

