"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase' // path confirm kar lijiye
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VendorDashboard() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorName, setVendorName] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all', 'cab', 'tour', 'hotel'
  const router = useRouter()

  useEffect(() => {
    checkVendorAccess()
  }, [])

  async function checkVendorAccess() {
    // 1. Check karein ki user logged in hai ya nahi
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // 2. Check karein ki user ka role 'vendor' hai aur woh 'approved' hai
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'vendor' || profile.approval_status !== 'approved') {
      router.push('/login') // Agar approved nahi hai toh wapas bhej do
      return
    }

    setVendorName(profile.full_name)
    fetchMyListings(session.user.id)
  }

  // 3. Sirf is vendor ki apni listings fetch karein
  async function fetchMyListings(userId: string) {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('vendor_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) setListings(data)
    setLoading(false)
  }

  // 4. Delete Logic
  const handleDelete = async (id: string, title: string) => {
    const isConfirmed = window.confirm(`Kya aap sach mein "${title}" ko delete karna chahte hain? Yeh wapas nahi aayega.`);
    
    if (isConfirmed) {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)

      if (!error) {
        // UI se delete ki hui listing ko turant hatana
        setListings(listings.filter(listing => listing.id !== id))
        alert('Listing successfully delete ho gayi.')
      } else {
        alert('Delete karne mein error aaya: ' + error.message)
      }
    }
  }

  // Helper to determine View URL based on category
  const getViewUrl = (listing: any) => {
    const slug = listing.slug || listing.id
    if (listing.category === 'tour') return `/tour/${slug}`
    if (listing.category === 'hotel') return `/hotel/${slug}`
    if (listing.category === 'cab') return `/cabs/${slug}`
    return `/listing/${slug}`
  }

  // Helper to determine Edit URL correctly based on category
  const getEditUrl = (listing: any) => {
    const cat = listing.category
    if (cat === 'tour') return `/vendor/edit/tour/${listing.id}`
    if (cat === 'hotel') return `/vendor/edit/hotel/${listing.id}`
    if (cat === 'cab') return `/vendor/edit/cab/${listing.id}`
    return `/vendor/edit/${listing.id}` // Fallback
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Tab Filtering Logic
  const filteredListings = activeTab === 'all' 
    ? listings 
    : listings.filter(listing => listing.category === activeTab);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Loading Dashboard...</div>

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Partner Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {vendorName}</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-start md:justify-end">
            {/* 👤 MY PROFILE BUTTON ADDED HERE */}
            <Link href="/vendor/profile" className="flex-1 md:flex-none text-center bg-gray-100 text-gray-800 font-bold px-5 py-2.5 rounded-lg hover:bg-gray-200 border border-gray-200 transition-colors shadow-sm">
              👤 My Profile
            </Link>
            
            <Link href="/add-listing" className="flex-1 md:flex-none text-center bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              + Add New Listing
            </Link>
            
            <button onClick={handleLogout} className="flex-1 md:flex-none text-center bg-red-50 text-red-600 font-bold px-5 py-2.5 rounded-lg hover:bg-red-100 transition-colors shadow-sm">
              Logout
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4">Manage My Packages & Services</h2>

        {/* Category Tabs */}
        <div className="flex space-x-2 md:space-x-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 font-bold rounded-lg whitespace-nowrap transition-colors shadow-sm ${activeTab === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
          >
            All Listings
          </button>
          <button 
            onClick={() => setActiveTab('cab')}
            className={`px-5 py-2.5 font-bold rounded-lg whitespace-nowrap transition-colors shadow-sm flex items-center gap-2 ${activeTab === 'cab' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
          >
            🚖 Cab / Taxi
          </button>
          <button 
            onClick={() => setActiveTab('tour')}
            className={`px-5 py-2.5 font-bold rounded-lg whitespace-nowrap transition-colors shadow-sm flex items-center gap-2 ${activeTab === 'tour' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
          >
            🗺️ Tour Packages
          </button>
          <button 
            onClick={() => setActiveTab('hotel')}
            className={`px-5 py-2.5 font-bold rounded-lg whitespace-nowrap transition-colors shadow-sm flex items-center gap-2 ${activeTab === 'hotel' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
          >
            🏨 Hotels
          </button>
        </div>
        
        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden relative flex flex-col">
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase shadow-sm ${
                  listing.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  listing.status === 'declined' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {listing.status === 'pending' ? '⏳ Pending' : listing.status === 'approved' ? '✅ Live' : '❌ Declined'}
                </span>
              </div>

              {/* Card Content */}
              <div className="p-6 flex-grow">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{listing.category}</span>
                <h3 className="text-lg font-bold mt-2 text-gray-900 pr-16 line-clamp-2">{listing.title}</h3>
                <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-4">
                  <span className="text-gray-500 text-sm font-medium">📍 {listing.location}</span>
                  <span className="text-xl font-bold text-gray-900">₹{listing.price}</span>
                </div>
              </div>

              {/* Action Buttons (View, Edit & Delete) */}
              <div className="border-t border-gray-100 p-4 bg-gray-50 grid grid-cols-3 gap-2">
                <Link 
                  href={getViewUrl(listing)} 
                  target="_blank" // Naye tab me kholne ke liye
                  className="bg-white border border-purple-200 text-purple-600 font-bold py-2 px-2 rounded-lg text-center hover:bg-purple-50 transition-colors text-xs shadow-sm flex flex-col items-center justify-center"
                >
                  <span className="text-base mb-1">👁️</span> View
                </Link>
                
                {/* ✏️ EDIT BUTTON WITH CORRECT URL ROUTING */}
                <Link 
                  href={getEditUrl(listing)} 
                  className="bg-white border border-blue-200 text-blue-600 font-bold py-2 px-2 rounded-lg text-center hover:bg-blue-50 transition-colors text-xs shadow-sm flex flex-col items-center justify-center"
                >
                  <span className="text-base mb-1">✏️</span> Edit
                </Link>

                <button 
                  onClick={() => handleDelete(listing.id, listing.title)}
                  className="bg-white border border-red-200 text-red-600 font-bold py-2 px-2 rounded-lg hover:bg-red-50 transition-colors text-xs shadow-sm flex flex-col items-center justify-center"
                >
                  <span className="text-base mb-1">🗑️</span> Delete
                </button>
              </div>

            </div>
          ))}

          {/* Empty State Check */}
          {filteredListings.length === 0 && listings.length > 0 && (
            <div className="col-span-full bg-white p-10 rounded-xl text-center border border-dashed border-gray-300">
              <p className="text-gray-500">Is category mein abhi tak aapne koi service list nahi ki hai.</p>
            </div>
          )}

          {listings.length === 0 && (
            <div className="col-span-full bg-white p-10 rounded-xl text-center border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">Aapne abhi tak koi service list nahi ki hai.</p>
              <Link href="/add-listing" className="text-blue-600 font-bold hover:underline">
                Pehli listing yahan banayein
              </Link>
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}