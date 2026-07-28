import { supabase } from '../utils/supabase'
import Link from 'next/link'
import type { Metadata } from 'next'
import MainSearchBox from './components/MainSearchBox'

// SEO Metadata for India Tour Operators
export const metadata: Metadata = {
  title: 'India Tour Operators - Best Tour Packages, Cabs & Hotels',
  description: 'Book verified India tour packages, outstation cabs, and luxury hotels with top-rated local tour operators across India at the best prices.',
  keywords: 'India tour operators, tour packages India, cab booking, hotel booking, travel agency India'
}

// Helper function to remove HTML tags and special entities
const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')   // Replace non-breaking spaces
    .replace(/&amp;/g, '&');   // Replace ampersands
}

export default async function Home() {
  // Supabase database se sirf 'approved' listings fetch karna
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching listings:', error)
  }

  // Blog aur Destination ko root slug par redirect karna
  const getListingUrl = (listing: any) => {
    const slug = listing.slug || listing.id
    if (listing.category === 'tour') return `/tour/${slug}`
    if (listing.category === 'hotel') return `/hotel/${slug}`
    if (listing.category === 'cab') return `/cabs/${slug}`
    if (listing.category === 'destination' || listing.category === 'blog') return `/${slug}`
    return `/listing/${slug}`
  }

  const getThumbnail = (listing: any) => {
    const meta = listing.metadata || {}
    if (meta.gallery && meta.gallery.length > 0 && meta.gallery[0].trim() !== '') {
      return meta.gallery[0]
    }
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=600'
  }

  // --- Grouping Listings by Category ---
  const tours = listings?.filter((l) => l.category === 'tour') || []
  const destinations = listings?.filter((l) => l.category === 'destination') || []
  const hotels = listings?.filter((l) => l.category === 'hotel') || []
  const cabs = listings?.filter((l) => l.category === 'cab') || []
  const blogs = listings?.filter((l) => l.category === 'blog') || []

  // Dynamic sections array taaki unhe loop kiya ja sake
  const sections = [
    { title: "Top Tour Packages", items: tours },
    { title: "Popular Tourist Destinations", items: destinations },
    { title: "Best Hotels & Stays", items: hotels },
    { title: "Reliable Outstation Cabs", items: cabs },
    { title: "Travel Guides & Expert Blogs", items: blogs },
  ]

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      
      {/* --- HERO SECTION --- */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Official India Tour Operators Portal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-4 mb-4 leading-tight">
            Discover Incredible India with Expert <span className="text-orange-400">Tour Operators</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Explore verified holiday tour packages, comfortable outstation cabs, and premium hotels handpicked for your dream vacation.
          </p>
        </div>

        {/* --- DYNAMIC SEARCH BOX COMPONENT --- */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <MainSearchBox />
        </div>
      </section>

      {/* Spacer for design spacing */}
      <div className="h-8 bg-gray-50"></div>

      {/* --- MAIN LISTINGS CONTAINER --- */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        
        {(!listings || listings.length === 0) && (
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Listings Found</h2>
            <p className="text-gray-500">Abhi koi tour packages ya services available nahi hain. Kripya baad mein check karein.</p>
          </div>
        )}

        {/* Loop through each grouped section */}
        {sections.map((section, idx) => {
          if (section.items.length === 0) return null; // Agar us category mein koi item nahi hai toh heading hide ho jayegi

          return (
            <div key={idx} className="mb-16">
              
              {/* Section Header */}
              <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {section.title}
                </h2>
                <span className="text-sm font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full whitespace-nowrap">
                  {section.items.length} {section.items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Section Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.items.map((listing) => {
                  const detailUrl = getListingUrl(listing)
                  const imageUrl = getThumbnail(listing)
                  
                  // Extract Excerpt
                  const excerpt = listing.metadata?.shortDescription || stripHtml(listing.description);
                  const isInfoContent = listing.category === 'destination' || listing.category === 'blog';

                  return (
                    <Link 
                      href={detailUrl} 
                      key={listing.id} 
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-pointer"
                    >
                      {/* Thumbnail Image */}
                      <div className="relative h-56 w-full bg-gray-200 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imageUrl} 
                          alt={listing.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
                          {listing.category === 'blog' && listing.metadata?.blogCategory ? listing.metadata.blogCategory : listing.category}
                        </span>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Title & Description */}
                          <h3 className="text-xl font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {listing.title}
                          </h3>
                          <p className="text-gray-600 mt-2 text-sm line-clamp-2 leading-relaxed">
                            {excerpt}
                          </p>
                        </div>
                        
                        <div>
                          {/* Location & Price / CTA */}
                          <div className="mt-6 flex justify-between items-end border-t border-gray-100 pt-4">
                            <span className="text-gray-500 text-sm font-medium flex items-center truncate max-w-[55%]">
                              📍 {listing.location || 'India'}
                            </span>
                            
                            <div className="text-right">
                              {isInfoContent ? (
                                <span className="block text-sm font-extrabold text-blue-600 mt-2">
                                  {listing.category === 'blog' ? 'Read Article →' : 'Explore Guide →'}
                                </span>
                              ) : (
                                <>
                                  <span className="block text-xs text-gray-400 font-medium mb-1">Starting from</span>
                                  <span className="text-xl font-extrabold text-green-600">
                                    ₹{listing.price}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

      </div>
    </main>
  )
}