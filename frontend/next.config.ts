import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	output: 'standalone',
	outputFileTracingRoot: process.cwd(),
	async rewrites() {
		return [
			{
				source: '/api/:path*',
				destination: `${process.env.API_INTERNAL_URL || 'http://localhost:3001/api'}/:path*`,
			},
		];
	},
};

export default nextConfig;
