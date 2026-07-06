/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Uploaded images are served from /uploads (public/uploads on disk).
  images: { unoptimized: true },
  // We optimize images ourselves with sharp on upload, then serve statically.
  // pdfkit reads its bundled AFM font-metrics files from disk at runtime (fs.readFileSync
  // relative to its own module dir) — webpack bundling breaks that path, so it must run
  // as a plain Node require() instead of being bundled into the route's chunk.
  experimental: { serverActions: { bodySizeLimit: '15mb' }, serverComponentsExternalPackages: ['pdfkit'] },
};

export default nextConfig;
