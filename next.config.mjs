/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ['192.168.0.87'],
  serverExternalPackages: ['@sparticuz/chromium'],
};

export default nextConfig;
