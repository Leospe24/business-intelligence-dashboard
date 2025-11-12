import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
    , tailwindcss()],
  server: {
    // This is crucial for Docker, it tells Vite to listen on all interfaces
    host: '0.0.0.0', 
    // Vite defaults to 5173 inside the container
    port: 5173, 
    
  },
})