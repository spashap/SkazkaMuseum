/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Uploaded images are served from /uploads (public/uploads on disk).
  images: { unoptimized: true },
  // We optimize images ourselves with sharp on upload, then serve statically.
  experimental: { serverActions: { bodySizeLimit: '15mb' } },
};

export default nextConfig;
