/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ['192.168.0.87'],
  serverExternalPackages: ['@sparticuz/chromium'],
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/@sparticuz/chromium/**/*'],
    },
  },
};

export default nextConfig;
