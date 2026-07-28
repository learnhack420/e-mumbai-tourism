"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AddListingMenu() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkVendorStatus()
  }, [])

  async function checkVendorStatus() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'vendor' || profile.approval_status !== 'approved') {
      router.push('/login')
      return
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Checking Permissions...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Aap kya list karna chahte hain?</h1>
          <p className="text-gray-500">Apni service ki sahi category chunein taaki hum aapko wahi options dikhayein jo aapke liye zaroori hain.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Option 1: Private Cab / Taxi Tour */}
          <Link href="/add-listing/cab" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all group text-center cursor-pointer">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform">
              🚕
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Private Cab / Taxi</h2>
            <p className="text-gray-500 text-sm">One-way, Round trip, Airport drop, ya customized private taxi tours.</p>
          </Link>

          {/* Option 2: Group Tour Package */}
          <Link href="/add-listing/tour" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:green-blue-500 transition-all group text-center cursor-pointer">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform">
              🗺️
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Group Tour Package</h2>
            <p className="text-gray-500 text-sm">Fixed departure tours, Itinerary, Inclusions/Exclusions ke sath.</p>
          </Link>

          {/* Option 3: Hotel / Homestay */}
          <Link href="/add-listing/hotel" className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:purple-blue-500 transition-all group text-center cursor-pointer">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform">
              🏨
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hotel / Homestay</h2>
            <p className="text-gray-500 text-sm">Rooms, amenities, aur per-night booking rates add karein.</p>
          </Link>

        </div>

        <div className="mt-10 text-center">
          <Link href="/vendor" className="text-blue-600 font-bold hover:underline">
            ← Wapas Dashboard par jayein
          </Link>
        </div>

      </div>
    </div>
  )
}