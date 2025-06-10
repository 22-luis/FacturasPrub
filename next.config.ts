
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // Ensures a smaller Docker image for Cloud Run
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
