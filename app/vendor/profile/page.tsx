"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
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
  const [website, setWebsite] = useState('') 
  
  // Logo aur Visiting Card URLs ke states
  const [logoUrl, setLogoUrl] = useState('')
  const [cardUrl, setCardUrl] = useState('')
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)
  const [newCardFile, setNewCardFile] = useState<File | null>(null)

  // Live Preview States for Newly Selected Files
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [cardPreview, setCardPreview] = useState<string | null>(null)

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
    setWebsite(profile.website || '') 
    setLogoUrl(profile.logo_url || '')
    setCardUrl(profile.visiting_card_url || '')
    setLoading(false)
  }

  // Handle Logo File Selection & Preview
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setNewLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  // Handle Visiting Card File Selection & Preview
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setNewCardFile(file)
      setCardPreview(URL.createObjectURL(file))
    }
  }

  // 🌟 NAYA: Supabase Storage Upload Helper Function
  const uploadFileToSupabaseStorage = async (file: File, folder: string) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('vendor_documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Public URL generate karna
      const { data } = supabase.storage
        .from('vendor_documents')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error: any) {
      console.error("Storage upload error:", error.message)
      return null
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage({ type: '', text: '' })

    let updatedLogoUrl = logoUrl
    let updatedCardUrl = cardUrl

    if (newLogoFile) {
      setMessage({ type: '', text: 'Uploading new logo to Supabase...' })
      const uploaded = await uploadFileToSupabaseStorage(newLogoFile, 'logos')
      if (uploaded) updatedLogoUrl = uploaded
    }

    if (newCardFile) {
      setMessage({ type: '', text: 'Uploading new visiting card to Supabase...' })
      const uploaded = await uploadFileToSupabaseStorage(newCardFile, 'visiting_cards')
      if (uploaded) updatedCardUrl = uploaded
    }

    setMessage({ type: '', text: 'Saving profile...' })

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        company_name: companyName,
        address: address,
        website: website, 
        logo_url: updatedLogoUrl,
        visiting_card_url: updatedCardUrl,
      })
      .eq('id', userId)

    if (error) {
      setMessage({ type: 'error', text: 'Profile update fail ho gaya: ' + error.message })
    } else {
      setLogoUrl(updatedLogoUrl)
      setCardUrl(updatedCardUrl)
      setNewLogoFile(null)
      setNewCardFile(null)
      setLogoPreview(null)
      setCardPreview(null)
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Business Website URL</label>
                <input type="url" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.yourtravelwebsite.com" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Address / Location</label>
                <textarea rows={3} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Aapka office ya business address..."></textarea>
              </div>

              {/* 🌟 DOCUMENTS & PREVIEW SECTION */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-6">
                <h3 className="text-sm font-black text-slate-800 border-b pb-2">Verification Documents & Previews</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Company Logo Box */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-bold text-slate-700">Company Logo</label>
                    <div className="flex items-center justify-center h-28 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 overflow-hidden relative">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="h-full object-contain" />
                      ) : logoUrl ? (
                        <img src={logoUrl} alt="Current Logo" className="h-full object-contain" />
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">No Logo Uploaded</span>
                      )}
                    </div>
                    <input type="file" accept="image/*" 
                      onChange={handleLogoChange}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
                  </div>

                  {/* Visiting Card Box */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-bold text-slate-700">Visiting Card</label>
                    <div className="flex items-center justify-center h-28 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 overflow-hidden relative">
                      {cardPreview ? (
                        <img src={cardPreview} alt="Card Preview" className="h-full object-contain" />
                      ) : cardUrl ? (
                        <img src={cardUrl} alt="Current Visiting Card" className="h-full object-contain" />
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">No Visiting Card Uploaded</span>
                      )}
                    </div>
                    <input type="file" accept="image/*" 
                      onChange={handleCardChange}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>

                </div>
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