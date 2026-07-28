"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase' // Path alias check kar lein

export default function VendorInfoCard({ vendorId }: { vendorId: string }) {
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails()
    } else {
      setLoading(false)
    }
  }, [vendorId])

  async function fetchVendorDetails() {
    // 1. Pehle 'profiles' table se website ke sath data dhoondein
    let { data, error } = await supabase
      .from('profiles')
      .select('full_name, company_name, phone, address, location, website')
      .eq('id', vendorId)
      .single()

    // 2. Agar profiles table mein data na mile, toh default fallback set karein
    if (error || !data || (!data.company_name && !data.phone)) {
      setVendor({
        full_name: 'Raj Cabs & Tours',
        company_name: 'Raj Cabs Official',
        phone: '9892455466',
        address: 'Mumbai, Maharashtra',
        website: 'https://www.example.com'
      })
    } else {
      setVendor(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="p-4 bg-slate-50 rounded-2xl animate-pulse text-xs text-slate-400">Loading Host/Vendor Info...</div>
  }

  if (!vendor) return null

  const firmName = vendor.company_name || vendor.full_name || 'Verified Tour Operator'
  const mobile = vendor.phone || '9892455466'
  const address = vendor.address || vendor.location || 'Mumbai, Maharashtra'
  const website = vendor.website || ''

  // URL clean formatting (agar https:// na ho toh laga dena)
  const formattedWebsite = website 
    ? (website.startsWith('http') ? website : `https://${website}`) 
    : ''

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl border border-slate-700 my-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">
          🏢
        </div>
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Listed By Partner</span>
          <h3 className="text-lg font-black text-white">{firmName}</h3>
        </div>
      </div>

      <div className="space-y-2.5 text-sm text-slate-300 border-t border-slate-700/60 pt-4">
        
        {/* Address */}
        <div className="flex items-start gap-3">
          <span className="text-base">📍</span>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Firm Address</span>
            <span className="font-medium text-slate-200">{address}</span>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-base">📞</span>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Direct Contact</span>
            <a href={`tel:${mobile}`} className="font-bold text-blue-400 hover:underline">
              {mobile}
            </a>
          </div>
        </div>

        {/* 🌟 NEW: Website Link Row (Agar vendor ne website bhari hogi tabhi dikhega) */}
        {formattedWebsite && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-base">🌐</span>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Official Website</span>
              <a href={formattedWebsite} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-400 hover:underline truncate block max-w-[240px]">
                {website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
        )}

      </div>

      <div className="mt-5 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>✅ Verified Local Partner</span>
        <span className="text-green-400 font-bold">● Active</span>
      </div>
    </div>
  )
}