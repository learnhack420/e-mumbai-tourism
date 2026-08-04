import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travel Blogs & Guides | India Tour Operators",
  description: "Explore travel guides, road trip tips, hill station itineraries, and cab booking insights across India.",
};

// Dummy blog posts (Aap baad mein ise Database ya CMS se connect kar sakte hain)
const blogPosts = [
  {
    id: "top-places-to-visit-in-kerala",
    title: "Top 5 Places to Visit in Kerala: God's Own Country Guide",
    excerpt: "Discover the serene backwaters of Alleppey, lush tea gardens of Munnar, and pristine beaches of Kovalam with our expert travel guide.",
    date: "August 2026",
    category: "Tour Guides",
    readTime: "5 min read",
    image: "🌴",
    gradient: "from-emerald-500 to-teal-700"
  },
  {
    id: "outstation-cab-travel-tips",
    title: "Essential Tips for Long Distance Outstation Cab Travel in India",
    excerpt: "Planning a road trip? Learn how to manage luggage, choose the right vehicle category, and ensure a smooth journey with verified drivers.",
    date: "August 2026",
    category: "Cab Travel",
    readTime: "4 min read",
    image: "🚖",
    gradient: "from-blue-600 to-cyan-600"
  },
  {
    id: "maharashtra-weekend-getaways",
    title: "Best Weekend Getaways from Mumbai and Pune by Road",
    excerpt: "Escape the city hustle! Explore Lonavala, Mahabaleshwar, Matheran, and Alibag with comfortable cab rentals and custom tour packages.",
    date: "July 2026",
    category: "Weekend Trips",
    readTime: "6 min read",
    image: "⛰️",
    gradient: "from-amber-500 to-orange-600"
  }
];

export default function BlogsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-blue-900 text-white rounded-3xl p-8 md:p-16 text-center relative overflow-hidden mb-12 shadow-sm">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="bg-blue-800 text-blue-200 text-xs font-black uppercase tracking-wider py-1.5 px-4 rounded-full inline-block mb-4">
              Travel Stories & Guides
            </span>
            <h1 className="text-3xl md:text-5xl font-black mb-4">Our Travel Blog</h1>
            <p className="text-blue-200 font-medium text-lg leading-relaxed">
              Get inspired for your next vacation, read expert road trip tips, and explore the best destinations across India.
            </p>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <div 
              key={post.id} 
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Card Banner / Icon Box */}
                <div className={`h-48 bg-gradient-to-br ${post.gradient} flex items-center justify-center text-6xl shadow-inner relative`}>
                  <span className="transform hover:scale-110 transition-transform">{post.image}</span>
                  <span className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-3">
                    <span>📅 {post.date}</span>
                    <span>•</span>
                    <span>⏱️ {post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-3 leading-snug hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Footer action */}
              <div className="px-6 pb-6 pt-0">
                <Link 
                  href={`/blogs/${post.id}`} 
                  className="inline-flex items-center gap-2 text-blue-600 font-black text-sm hover:text-blue-700 transition-colors"
                >
                  Read Full Article &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div className="mt-16 text-center">
          <Link href="/" className="text-blue-600 font-bold hover:underline">
            &larr; Return to Homepage
          </Link>
        </div>

      </div>
    </main>
  );
}