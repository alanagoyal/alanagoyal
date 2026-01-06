/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Only apply rewrites if NEXT_PUBLIC_MESSAGES_URL is defined
    if (process.env.NEXT_PUBLIC_MESSAGES_URL) {
      return [
        {
          source: '/messages',
          destination: `${process.env.NEXT_PUBLIC_MESSAGES_URL}/messages`,
        },
        {
          source: '/messages/:path*',
          destination: `${process.env.NEXT_PUBLIC_MESSAGES_URL}/messages/:path*`,
        },
      ];
    }
    return [];
  },
  async redirects() {
    return [
      // Legacy note slugs redirect to /notes/*
      // Only match paths that have at least one character and aren't reserved
      {
        source: '/:path((?!notes|api|messages|_next|static|public|icons|favicon\\.ico|sitemap\\.xml|robots\\.txt).+)',
        destination: '/notes/:path',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
