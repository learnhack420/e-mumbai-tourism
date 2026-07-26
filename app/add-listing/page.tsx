"use client"
import { useState } from 'react'
import { supabase } from '../../utils/supabase'

export default function AddListing() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Tour Package',
    location: '',
    price: ''
  })
  const [status, setStatus] = useState({ loading: false, success: false, error: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, success: false, error: '' })

    try {
      // Simple logic ke liye abhi hum apne test vendor ka ID use kar rahe hain
      // Real app mein yahan logged-in user ka ID aayega
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('email', 'partner@rajtravels.com')
        .single()

      if (!vendorData) throw new Error("Vendor account nahi mila.")

      // Database mein nayi listing add karna (By default yeh 'pending' jayegi)
      const { error } = await supabase
        .from('listings')
        .insert([
          {
            vendor_id: vendorData.id,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            location: formData.location,
            price: Number(formData.price)
          }
        ])

      if (error) throw error

      setStatus({ loading: false, success: true, error: '' })
      setFormData({ title: '', description: '', category: 'Tour Package', location: '', price: '' }) // Form reset

    } catch (err: any) {
      setStatus({ loading: false, success: false, error: err.message || 'Kuch galat ho gaya.' })
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Partner Onboarding</h1>
        <p className="text-gray-500 mb-8">Apna naya travel package ya cab service yahan list karein.</p>

        {status.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium">
            ✅ Aapki listing successfully submit ho gayi hai! Admin ke approve karne ke baad yeh website par dikhegi.
          </div>
        )}

        {status.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium">
            ❌ {status.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Listing Title</label>
            <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} 
              placeholder="Jaise: 3-Day Manali Tour" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24" 
              value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} 
              placeholder="Itinerary aur details yahan likhein..." />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
              <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option>Tour Package</option>
                <option>Cab Service</option>
                <option>Homestay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
              <input required type="number" min="0" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} 
                placeholder="Ex: 5000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
            <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} 
              placeholder="Jaise: Manali, Himachal Pradesh" />
          </div>

          <button type="submit" disabled={status.loading} 
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">
            {status.loading ? 'Submitting...' : 'Submit Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}