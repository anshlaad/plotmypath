import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // App apne aap background mein update ho jayegi
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // (Agar ye files nahi hain, toh bhi koi dikkat nahi)
      manifest: {
        name: 'PlotMyPath',
        short_name: 'PlotMyPath',
        description: 'Your AI-powered travel companion.',
        theme_color: '#0f172a', // Aapka Slate-900 color taaki top bar dark rahe
        background_color: '#0f172a',
        display: 'standalone', // Ye browser URL bar ko gayab kar dega (Real app feel)
        icons: [
          {
            src: '/logo-192x192.png', // 👈 Dhyan dena!
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-512x512.png', // 👈 Dhyan dena!
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});