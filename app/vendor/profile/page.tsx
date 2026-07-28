"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' // Path alias check kar lein
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VendorProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [userId, setUserId] = useState('')

  // Profile States
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('') // 🌟 NEW: Website State

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error || !profile || profile.role !== 'vendor') {
      router.push('/login')
      return
    }

    setUserId(session.user.id)
    setFullName(profile.full_name || '')
    setEmail(profile.email || '')
    setPhone(profile.phone || '')
    setCompanyName(profile.company_name || '')
    setAddress(profile.address || '')
    setWebsite(profile.website || '') // 🌟 NEW: Set Website
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        company_name: companyName,
        address: address,
        website: website, // 🌟 NEW: Update Website
      })
      .eq('id', userId)

    if (error) {
      setMessage({ type: 'error', text: 'Profile update fail ho gaya: ' + error.message })
    } else {
      setMessage({ type: 'success', text: '✅ Profile successfully update ho gayi!' })
    }
    setUpdating(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Loading Profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
            <p className="text-gray-500 mt-1">Apni personal aur business details manage karein</p>
          </div>
          <Link href="/vendor" className="bg-white border border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
            ← Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input type="text" required className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input type="email" disabled className="w-full px-4 py-3 border rounded-xl outline-none bg-gray-100 text-gray-500 cursor-not-allowed" value={email} title="Email cannot be changed directly" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Agency / Company Name</label>
                  <input type="text" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Dream Travel Agency" />
                </div>
              </div>

              {/* 🌟 NEW: Website URL Input Field */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Business Website URL</label>
                <input type="url" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.yourtravelwebsite.com" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Address / Location</label>
                <textarea rows={3} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Aapka office ya business address..."></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={updating} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all disabled:bg-blue-400 shadow-md">
                  {updating ? 'Updating...' : 'Save Profile Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}