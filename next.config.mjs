/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ['192.168.0.87'],
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/@sparticuz/chromium/**/*',
      './node_modules/puppeteer-core/**/*'
    ],
  },
};

export default nextConfig;
