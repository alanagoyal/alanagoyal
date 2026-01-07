/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Rewrites disabled for desktop environment - Messages app is embedded directly
    // Static assets are served from /public/messages/
    return [];
  },
  async redirects() {
    return [
      // Legacy note slugs redirect to /notes/*
      // Only match paths that have at least one character and aren't reserved
      {
        source: '/:path((?!notes|api|messages|settings|headshot|_next|static|public|icons|favicon\\.ico|sitemap\\.xml|robots\\.txt).+)',
        destination: '/notes/:path',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
