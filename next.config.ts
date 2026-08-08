import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/trip/:slug*', // Jo URL /trip/ se aayega
        destination: '/tour/:slug*', // Usko /tour/ par bhej dega
        permanent: true, // 301 SEO-friendly redirect
      },
    ];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());