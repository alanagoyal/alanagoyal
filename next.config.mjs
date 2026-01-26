/**
 * @type {import('next').NextConfig}
 *
 * Routing behavior:
 * - /                    → redirects to /notes/about-me, shows default desktop layout
 * - /notes               → on desktop: updates URL to /notes/about-me, notes focused
 *                          on mobile: shows sidebar (no redirect)
 * - /notes/{slug}        → shows the note (notes focused)
 * - /{app}               → shows default desktop with that app focused
 * - /notes/{invalid}     → redirects to /notes/error
 * - /{legacy-slug}       → redirects to /notes/{legacy-slug} (server-side, permanent)
 * - /{other}             → 404
 */

// Extract Supabase hostname from environment variable
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage for photos
      ...(supabaseHostname ? [{
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      }] : []),
    ],
  },
  async rewrites() {
    return [];
  },
  async redirects() {
    // Legacy note slugs that were publicly shared before /notes/* prefix was added.
    // These are permanent (308) redirects so browsers cache them.
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

    return [
      // Legacy note slugs redirect to /notes/*
      ...legacyNoteSlugs.map((slug) => ({
        source: `/${slug}`,
        destination: `/notes/${slug}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
