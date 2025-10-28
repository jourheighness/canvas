import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), '')
	
	return {
		plugins: [cloudflare(), react()],
		css: {
			postcss: './postcss.config.js',
		},
		define: {
			// Make sure VITE_TLDRAW_LICENSE_KEY is available at build time
			'import.meta.env.VITE_TLDRAW_LICENSE_KEY': JSON.stringify(env.VITE_TLDRAW_LICENSE_KEY || ''),
		},
	}
})