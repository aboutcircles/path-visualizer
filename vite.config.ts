// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	server: {
		proxy: {
			// Proxy requests from /api to https://pathfinder.circlesubi.id
			'/api': {
				target: 'https://pathfinder.circlesubi.id',
				changeOrigin: true, // this is necessary for virtual hosted sites
				rewrite: (path) => path.replace(/^\/api/, '') // remove /api prefix before making the request
			},
			'/avatars': { // Assuming the avatar path can be isolated
				target: 'https://circles-ubi.s3.amazonaws.com/uploads/avatars',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/avatars/, '')
			}
		}
	}
});
