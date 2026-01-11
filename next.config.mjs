/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Rewrites disabled for desktop environment - Messages app is embedded directly
    // Static assets are served from /public/messages/
    return [];
  },
  async redirects() {
    // Legacy note slugs that were publicly shared before /notes/* prefix
    const legacyNoteSlugs = [
      'quick-links',
      'principles',
      'on-repeat',
      'fav-blogs',
      'bookmarks',
      'about-me',
      'cool-websites',
      'groceries',
      'fav-spots',
      'inspo',
      'how-this-works',
      'reading-list',
      'fav-products',
    ];

    return legacyNoteSlugs.map((slug) => ({
      source: `/${slug}`,
      destination: `/notes/${slug}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
