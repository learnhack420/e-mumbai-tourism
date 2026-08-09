import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Pehla Redirect: /trip/ wale sabhi URLs ko /tour/ par bhejega
      {
        source: '/trip/:slug*', 
        destination: '/tour/:slug*', 
        permanent: true, 
      },
      // Doosra Redirect: /tour-package/ wale sabhi URLs ko bhi /tour/ par bhejega
      {
        source: '/tour-package/:slug*', 
        destination: '/tour/:slug*', 
        permanent: true, 
      },
    ];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());