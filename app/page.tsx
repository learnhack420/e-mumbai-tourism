import { supabase } from '../utils/supabase'

// Next.js Server Component - SEO ke liye best hai
export default async function Home() {
  // Supabase database se listings fetch karna
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching listings:', error)
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-900">
          Explore All-India <span className="text-blue-600">Travel & Homestays</span>
        </h1>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings && listings.length > 0 ? (
            listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  {/* Category Tag */}
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">
                    {listing.category}
                  </span>
                  
                  {/* Title & Description */}
                  <h2 className="text-xl font-bold mt-4 text-gray-800">{listing.title}</h2>
                  <p className="text-gray-600 mt-3 text-sm line-clamp-3">{listing.description}</p>
                  
                  {/* Location & Price */}
                  <div className="mt-6 flex justify-between items-center border-t border-gray-100 pt-4">
                    <span className="text-gray-500 text-sm font-medium flex items-center">
                      📍 {listing.location}
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{listing.price}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center col-span-full py-10">
              Abhi koi tour packages ya homestays available nahi hain.
            </p>
          )}
        </div>
        
      </div>
    </main>
  )
}