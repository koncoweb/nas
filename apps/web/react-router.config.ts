import type { Config } from '@react-router/dev/config';

export default {
	appDirectory: './src/app',
	ssr: true,
	// Remove prerender for Vercel compatibility
	// Vercel will handle routing dynamically
	serverBuildFile: 'index.js',
} satisfies Config;
