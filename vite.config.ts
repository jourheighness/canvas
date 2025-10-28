import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(() => {
	return {
		plugins: [cloudflare(), react()],
		css: {
			postcss: './postcss.config.js',
		},
		define: {
			'process.env.VITE_TLDRAW_LICENSE_KEY': JSON.stringify(process.env.VITE_TLDRAW_LICENSE_KEY),
			'process.env.TLDRAW_LICENSE_KEY': JSON.stringify(process.env.TLDRAW_LICENSE_KEY)
		}
	}
})