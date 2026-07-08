// The whole app (admin session times, calendar math, Date parsing/formatting) assumes
// the server's local clock is Moscow time — the museum only ever operates in one
// timezone. Force it here so sessions created in the admin match what the public site
// shows, regardless of the OS timezone of whatever machine/VPS actually runs the process.
process.env.TZ = 'Europe/Moscow';

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
