"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [listings, setListings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
  }, [])

  // Check karna ki admin logged in hai ya nahi
  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // Agar login nahi hai, toh wapas login page par bhej do
      router.push('/login')
    } else {
      // Agar login hai, tabhi listings fetch karo
      fetchListings()
    }
  }

  async function fetchListings() {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setListings(data)
    setIsLoading(false)
  }

  async function updateListingStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', id)
    
    if (!error) {
      fetchListings()
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Checking Security...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-100 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-200">
            Logout
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title & Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{listing.title}</div>
                    <div className="text-sm text-gray-500 mt-1">📍 {listing.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">₹{listing.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${
                      listing.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      listing.status === 'declined' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {listing.status === 'pending' && (
                      <>
                        <button onClick={() => updateListingStatus(listing.id, 'approved')} className="text-green-600 hover:text-green-900 mr-5">Approve</button>
                        <button onClick={() => updateListingStatus(listing.id, 'declined')} className="text-red-600 hover:text-red-900">Decline</button>
                      </>
                    )}
                    {listing.status === 'approved' && (
                      <button onClick={() => updateListingStatus(listing.id, 'declined')} className="text-red-600 hover:text-red-900">Decline</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {listings.length === 0 && <div className="p-6 text-center text-gray-500">Abhi koi data majood nahi hai.</div>}
        </div>
      </div>
    </div>
  )
}