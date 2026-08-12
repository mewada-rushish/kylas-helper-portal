/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ['192.168.0.151'],
  serverExternalPackages: ['@sparticuz/chromium'],
};

export default nextConfig;
