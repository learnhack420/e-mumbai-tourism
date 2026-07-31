"use client"
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../../utils/supabase' 
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
// 👇 Import LocationSelector component
import LocationSelector from '../../components/LocationSelector' 

function CabFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit') 

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  // 🌟 AI SEO Co-pilot States
  const [isAiOptimizing, setIsAiOptimizing] = useState(false)
  const [seoScore, setSeoScore] = useState<number | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('') 
  const [slugEdited, setSlugEdited] = useState(false) 

  // 🌟 SEO Meta States (New)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')

  const [mainType, setMainType] = useState('Local') 
  const [subType, setSubType] = useState('Point to Point') 

  const initialCabPrices = {
    'Bike': { amount: '', extraKm: '', extraHour: '', driverAllowance: '' },
    'Auto': { amount: '', extraKm: '', extraHour: '', driverAllowance: '' },
    'Hatchback': { amount: '', extraKm: '', extraHour: '', driverAllowance: '' },
    'Sedan cab': { amount: '', extraKm: '', extraHour: '', driverAllowance: '' },
    'SUV cab': { amount: '', extraKm: '', extraHour: '', driverAllowance: '' },
    'Innova cab': { amount: '', extraKm: '', extraHour: '', driverAllowance: '' }
  }
  const [cabPrices, setCabPrices] = useState(initialCabPrices)
  const [description, setDescription] = useState('')

  const [serviceCity, setServiceCity] = useState('')
  const [pickupPoint, setPickupPoint] = useState('')
  const [dropPoint, setDropPoint] = useState('')
  const [rentalPackage, setRentalPackage] = useState('8 Hour 80km')
  const [pickupCity, setPickupCity] = useState('')
  const [dropCity, setDropCity] = useState('') 
  
  const [distance, setDistance] = useState('')
  const [nightCharge, setNightCharge] = useState('') 
  const [minKmPerDay, setMinKmPerDay] = useState('250') 

  const [tollCharges, setTollCharges] = useState('Yes')
  const [parkingCharges, setParkingCharges] = useState('Yes')
  const [driverDa, setDriverDa] = useState('Yes')
  
  const [customInclusions, setCustomInclusions] = useState([''])
  const [customExclusions, setCustomExclusions] = useState([''])

  const [gallery, setGallery] = useState([''])
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }])

  useEffect(() => {
    checkVendorAndLoadData()
  }, [editId])

  useEffect(() => {
    if (!editId) {
      if (mainType === 'Local') setSubType('Point to Point')
      else if (mainType === 'Outstation') setSubType('One Way')
    }
  }, [mainType])

  async function checkVendorAndLoadData() {
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

    if (!profile || (profile.role !== 'vendor' && profile.role !== 'admin')) {
      router.push('/login')
      return
    }

    setVendorId(session.user.id)

    if (editId) {
      const { data: listing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', editId)
        .single()

      if (error || !listing) {
        setMessage({ type: 'error', text: 'Listing nahi mili!' })
        setLoading(false)
        return
      }

      setTitle(listing.title || '')
      setSlug(listing.slug || '')
      setSlugEdited(true)

      const meta = typeof listing.metadata === 'string' ? JSON.parse(listing.metadata) : (listing.metadata || {})
      
      // Load SEO Data
      setMetaTitle(meta.seo?.metaTitle || '')
      setMetaDescription(meta.seo?.metaDescription || '')
      setMetaKeywords(meta.seo?.metaKeywords || '')

      setMainType(meta.mainType || 'Local')
      setSubType(meta.subType || 'Point to Point')
      if (meta.cabPrices) setCabPrices(meta.cabPrices)
      setDescription(meta.description || '')

      setServiceCity(meta.serviceCity || '')
      setPickupPoint(meta.pickupPoint || '')
      setDropPoint(meta.dropPoint || '')
      setRentalPackage(meta.rentalPackage || '8 Hour 80km')
      setPickupCity(meta.pickupCity || '')
      setDropCity(meta.dropCity || '')
      setDistance(meta.distance || '')
      setNightCharge(meta.nightCharge || '')
      setMinKmPerDay(meta.minKmPerDay || '250')

      setTollCharges(meta.tollCharges || 'Yes')
      setParkingCharges(meta.parkingCharges || 'Yes')
      setDriverDa(meta.driverDa || 'Yes')

      if (meta.customInclusions && Array.isArray(meta.customInclusions) && meta.customInclusions.length > 0) {
        setCustomInclusions(meta.customInclusions)
      } else {
        setCustomInclusions([''])
      }
      
      if (meta.customExclusions && Array.isArray(meta.customExclusions) && meta.customExclusions.length > 0) {
        setCustomExclusions(meta.customExclusions)
      } else {
        setCustomExclusions([''])
      }

      if (meta.gallery && Array.isArray(meta.gallery) && meta.gallery.length > 0) {
        setGallery(meta.gallery)
      } else {
        setGallery([''])
      }

      if (meta.faqs && Array.isArray(meta.faqs) && meta.faqs.length > 0) {
        setFaqs(meta.faqs)
      } else {
        setFaqs([{ question: '', answer: '' }])
      }
    }

    setLoading(false)
  }

  // 🌟 AI SEO Optimizer Handler Function
  const handleAiSeoOptimize = async () => {
    if (!title && !description) {
      alert("Please enter a Service Title or Description first!")
      return
    }

    setIsAiOptimizing(true)
    try {
      const res = await fetch('/api/seo-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title, 
          description: description 
        })
      })

      const json = await res.json()
      if (json.success && json.data) {
        if (json.data.metaTitle) setMetaTitle(json.data.metaTitle)
        if (json.data.metaDescription) setMetaDescription(json.data.metaDescription)
        if (json.data.metaKeywords) setMetaKeywords(json.data.metaKeywords)
        if (json.data.seoScore) setSeoScore(json.data.seoScore)
        if (json.data.suggestions) setAiSuggestions(json.data.suggestions)
      } else {
        alert(`AI SEO Error: ${json.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      console.error(err)
      alert(`Network/Client Error: ${err.message}`)
    } finally {
      setIsAiOptimizing(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!slugEdited) {
      const generatedSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')    
      setSlug(generatedSlug)
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugEdited(true) 
  }

  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...gallery]; newGallery[index] = value; setGallery(newGallery)
  }
  const addGalleryImage = () => setGallery([...gallery, ''])
  const removeGalleryImage = (index: number) => { if (gallery.length > 1) setGallery(gallery.filter((_, i) => i !== index)) }

  const handleCustomInclChange = (index: number, value: string) => {
    const newArr = [...customInclusions]; newArr[index] = value; setCustomInclusions(newArr)
  }
  const addCustomIncl = () => setCustomInclusions([...customInclusions, ''])
  const removeCustomIncl = (index: number) => setCustomInclusions(customInclusions.filter((_, i) => i !== index))

  const handleCustomExclChange = (index: number, value: string) => {
    const newArr = [...customExclusions]; newArr[index] = value; setCustomExclusions(newArr)
  }
  const addCustomExcl = () => setCustomExclusions([...customExclusions, ''])
  const removeCustomExcl = (index: number) => setCustomExclusions(customExclusions.filter((_, i) => i !== index))

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]; newFaqs[index][field] = value; setFaqs(newFaqs)
  }
  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const removeFaq = (index: number) => { if (faqs.length > 1) setFaqs(faqs.filter((_, i) => i !== index)) }

  const handleCabPriceChange = (cab: string, field: string, value: string) => {
    setCabPrices(prev => ({ ...prev, [cab]: { ...prev[cab as keyof typeof cabPrices], [field]: value } }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    const activeCabs = Object.entries(cabPrices).filter(([_, data]) => data.amount.trim() !== '')
    if (activeCabs.length === 0) {
      setMessage({ type: 'error', text: 'Error: Kam se kam ek gaadi (Cab Category) ka amount daalna zaroori hai!' })
      setSubmitting(false)
      return
    }

    const lowestPrice = Math.min(...activeCabs.map(([_, data]) => parseFloat(data.amount)))
    
    const formattedCabPricing = activeCabs.map(([cab, data]) => {
      if (subType === 'Round Trip') {
        let text = `• ${cab}: ₹${data.amount} / KM`
        if (data.driverAllowance) text += ` | Driver DA: ₹${data.driverAllowance} / Day`
        return text
      } else if (subType === 'Local Rental') {
        let text = `• ${cab}: ₹${data.amount}`
        if (data.extraKm) text += ` | Extra KM: ₹${data.extraKm}`
        if (data.extraHour) text += ` | Extra Hour: ₹${data.extraHour}`
        return text
      } else if (subType === 'One Way') {
        let text = `• ${cab}: ₹${data.amount}`
        if (data.extraKm) text += ` | Extra KM: ₹${data.extraKm}`
        return text
      } else {
        return `• ${cab}: ₹${data.amount}`
      }
    }).join('\n')

    let incl = []
    let excl = ['Tourist attraction Fees', 'State border tax']
    
    if (tollCharges === 'Yes') incl.push('Toll charges')
    else excl.push('Toll charges')

    if (parkingCharges === 'Yes') incl.push('Parking charges')
    else excl.push('Parking charges')

    if (subType !== 'Round Trip') {
      if (driverDa === 'Yes') incl.push('Driver DA')
      else excl.push('Driver DA')
    }

    if (subType !== 'One Way') {
      excl.push('Night charges (if traveling between 9PM-6AM)')
    }

    const cleanCustomIncl = customInclusions.filter(item => item && item.trim() !== '')
    const cleanCustomExcl = customExclusions.filter(item => item && item.trim() !== '')
    
    incl = [...incl, ...cleanCustomIncl]
    excl = [...excl, ...cleanCustomExcl]

    const finalInclusions = incl.join(', ') || 'None'
    const finalExclusions = excl.join(', ') || 'None'

    const formattedFaqs = faqs.filter(f => f.question.trim() !== '' && f.answer.trim() !== '').map(f => `❓ Q: ${f.question}\n👉 A: ${f.answer}`).join('\n\n') || 'No FAQs provided';

    let displayLocation = ''
    let tripDetails = ''

    if (subType === 'Point to Point') {
      displayLocation = serviceCity; tripDetails = `Pickup: ${pickupPoint} | Drop: ${dropPoint}`
    } else if (subType === 'Local Rental') {
      displayLocation = serviceCity; tripDetails = `Package: ${rentalPackage}`
    } else if (subType === 'One Way') {
      displayLocation = `${pickupCity} to ${dropCity}`; tripDetails = `Distance: ${distance} km | Night Charges (9PM-6AM): ₹${nightCharge}`
    } else if (subType === 'Round Trip') {
      displayLocation = `${pickupCity} to ${dropCity} (Round Trip)`; tripDetails = `Est. Distance: ${distance} km | Minimum Chargeable: ${minKmPerDay} KM/Day`
    }

    const detailedDescription = `
🚖 **Available Cabs & Pricing:**
${formattedCabPricing}

🗺️ **Trip Type:** ${mainType} (${subType})
📌 **Trip Details:** ${tripDetails}

📝 **Description:**
${description || 'No additional details provided.'}

✅ **Included:** ${finalInclusions}
❌ **Not Included:** ${finalExclusions}

💡 **Frequently Asked Questions:**
${formattedFaqs}
    `.trim()

    const cleanGallery = gallery.filter(link => link && link.trim() !== '')

    const metadata = {
      mainType, 
      subType, 
      cabPrices, 
      description,
      serviceCity, 
      pickupPoint, 
      dropPoint, 
      rentalPackage,
      pickupCity, 
      dropCity, 
      distance, 
      nightCharge, 
      minKmPerDay,
      tollCharges, 
      parkingCharges, 
      driverDa, 
      customInclusions: cleanCustomIncl, 
      customExclusions: cleanCustomExcl, 
      gallery: cleanGallery, 
      faqs,
      seo: {
        metaTitle,
        metaDescription,
        metaKeywords
      }
    }

    let error;

    if (editId) {
      const res = await supabase.from('listings').update({
        title: title, 
        slug: slug, 
        description: detailedDescription, 
        location: displayLocation, 
        price: lowestPrice, 
        metadata: metadata
      }).eq('id', editId)
      error = res.error
    } else {
      const res = await supabase.from('listings').insert([{
        vendor_id: vendorId, 
        title: title, 
        slug: slug, 
        description: detailedDescription, 
        category: 'cab', 
        location: displayLocation, 
        price: lowestPrice, 
        status: 'pending', 
        metadata: metadata
      }])
      error = res.error
    }

    if (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message })
      setSubmitting(false)
    } else {
      setMessage({ type: 'success', text: editId ? 'Cab Service successfully update ho gayi hai!' : 'Cab Service successfully add ho gayi hai!' })
      setSubmitting(false)
      setTimeout(() => { 
        router.push('/admin')
      }, 1500)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Loading...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">{editId ? 'Edit Cab / Taxi Service' : 'Add Cab / Taxi Service'}</h1>
            <p className="text-blue-100 text-sm mt-1">Apni gaadi aur trip ki details bharein</p>
          </div>
          <Link href="/admin" className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            ← Back
          </Link>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- 🤖 AI SEO OPTIMIZER WIDGET --- */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-500/30">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    🤖 AI Co-pilot
                  </span>
                  <h3 className="text-xl font-black mt-2">Autonomous SEO Optimizer</h3>
                  <p className="text-slate-300 text-sm">Let AI audit your Title & Description to auto-generate high-ranking Meta tags.</p>
                </div>
                
                <button
                  type="button"
                  onClick={handleAiSeoOptimize}
                  disabled={isAiOptimizing}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 whitespace-nowrap"
                >
                  {isAiOptimizing ? 'Analyzing Content...' : '✨ Run AI SEO Audit & Fix'}
                </button>
              </div>

              {/* SEO Score & Suggestions feedback panel */}
              {seoScore !== null && (
                <div className="mt-4 pt-4 border-t border-indigo-700/50 flex flex-col md:flex-row gap-6 items-start">
                  <div className="bg-indigo-950/80 px-6 py-4 rounded-xl border border-indigo-500/40 text-center min-w-[140px]">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">SEO Score</span>
                    <span className={`text-3xl font-black ${seoScore > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {seoScore}/100
                    </span>
                  </div>

                  {aiSuggestions.length > 0 && (
                    <div className="flex-1">
                      <span className="block text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">AI Recommendations:</span>
                      <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
                        {aiSuggestions.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title & SEO Slug */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">1. Service Title & SEO</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Service Title</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={title} onChange={handleTitleChange} placeholder="e.g. Mumbai to Pune Cab Service" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SEO URL (Slug)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-200 border border-gray-300 border-r-0 rounded-l-lg text-gray-500 text-sm select-none">/cabs/</span>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-blue-700" value={slug} onChange={handleSlugChange} placeholder="e.g. mumbai-to-pune-cab" />
                  </div>
                </div>
              </div>

              {/* 🌟 New Meta Fields for SEO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-blue-900 mb-1">Meta Title (SEO)</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg outline-none bg-white" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="e.g. Best Mumbai to Pune Cab Service - Book Taxi Online" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Meta Description</label>
                  <textarea rows={2} className="w-full px-4 py-2 border rounded-lg outline-none bg-white resize-none" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Short description for Google search results..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-900 mb-1">Meta Keywords</label>
                  <textarea rows={2} className="w-full px-4 py-2 border rounded-lg outline-none bg-white resize-none" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="e.g. mumbai to pune cab, one way taxi, round trip"></textarea>
                </div>
              </div>
            </div>

            {/* Trip Type Selection */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-lg font-bold text-blue-900 mb-4">2. Select Trip Type</h2>
              <div className="flex gap-4 mb-4">
                <label className="flex-1 cursor-pointer">
                  <div className={`text-center py-3 rounded-lg border-2 font-bold transition-colors ${mainType === 'Local' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600'}`} onClick={() => setMainType('Local')}>🏙️ Local</div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <div className={`text-center py-3 rounded-lg border-2 font-bold transition-colors ${mainType === 'Outstation' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600'}`} onClick={() => setMainType('Outstation')}>🛣️ Outstation</div>
                </label>
              </div>

              {mainType === 'Local' && (
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 font-medium text-blue-900">
                    <input type="radio" checked={subType === 'Point to Point'} onChange={() => setSubType('Point to Point')} /> Point to Point
                  </label>
                  <label className="flex items-center gap-2 font-medium text-blue-900 ml-4">
                    <input type="radio" checked={subType === 'Local Rental'} onChange={() => setSubType('Local Rental')} /> Local Rental
                  </label>
                </div>
              )}

              {mainType === 'Outstation' && (
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 font-medium text-blue-900">
                    <input type="radio" checked={subType === 'One Way'} onChange={() => setSubType('One Way')} /> One Way
                  </label>
                  <label className="flex items-center gap-2 font-medium text-blue-900 ml-4">
                    <input type="radio" checked={subType === 'Round Trip'} onChange={() => setSubType('Round Trip')} /> Round Trip
                  </label>
                </div>
              )}
            </div>

            {/* Route & Details Configuration */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">3. Route & Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {subType === 'Point to Point' && (
                  <>
                    <div className="md:col-span-2">
                      <LocationSelector 
                        label="Service City" 
                        selected={serviceCity} 
                        onChange={setServiceCity} 
                        placeholder="Select Service City..." 
                      />
                    </div>
                    <div>
                      <LocationSelector 
                        label="Pickup Point" 
                        selected={pickupPoint} 
                        onChange={setPickupPoint} 
                        placeholder="Select Pickup Location..." 
                      />
                    </div>
                    <div>
                      <LocationSelector 
                        label="Drop Point" 
                        selected={dropPoint} 
                        onChange={setDropPoint} 
                        placeholder="Select Drop Location..." 
                      />
                    </div>
                  </>
                )}

                {subType === 'Local Rental' && (
                  <>
                    <div>
                      <LocationSelector 
                        label="Service City" 
                        selected={serviceCity} 
                        onChange={setServiceCity} 
                        placeholder="Select Service City..." 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Rental Package</label>
                      <select className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 h-[42px]" value={rentalPackage} onChange={(e) => setRentalPackage(e.target.value)}>
                        <option>4 Hour 40km</option>
                        <option>6 Hour 60km</option>
                        <option>8 Hour 80km</option>
                        <option>10 Hour 100km</option>
                      </select>
                    </div>
                  </>
                )}

                {subType === 'One Way' && (
                  <>
                    <div>
                      <LocationSelector 
                        label="Pickup City" 
                        selected={pickupCity} 
                        onChange={setPickupCity} 
                        placeholder="Select Pickup City..." 
                      />
                    </div>
                    <div>
                      <LocationSelector 
                        label="Drop City" 
                        selected={dropCity} 
                        onChange={setDropCity} 
                        placeholder="Select Drop City..." 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Total Distance (km)</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 h-[42px]" value={distance} onChange={(e) => setDistance(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Night Charge (9pm-6am) Amount ₹</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 h-[42px]" value={nightCharge} onChange={(e) => setNightCharge(e.target.value)} />
                    </div>
                  </>
                )}

                {subType === 'Round Trip' && (
                  <>
                    <div>
                      <LocationSelector 
                        label="Pickup City" 
                        selected={pickupCity} 
                        onChange={setPickupCity} 
                        placeholder="Select Pickup City..." 
                      />
                    </div>
                    <div>
                      <LocationSelector 
                        label="Destination City" 
                        selected={dropCity} 
                        onChange={setDropCity} 
                        placeholder="Select Destination City..." 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Estimated Distance (km)</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 h-[42px]" value={distance} onChange={(e) => setDistance(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Min KM per Day limit</label>
                      <input type="number" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 h-[42px]" value={minKmPerDay} onChange={(e) => setMinKmPerDay(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Cab Categories & Pricing */}
            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
              <h2 className="text-lg font-bold text-green-900 mb-2">4. Select Cabs & Add Prices</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {['Bike', 'Auto', 'Hatchback', 'Sedan cab', 'SUV cab', 'Innova cab'].map((cab) => (
                  <div key={cab} className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-green-200">
                    <span className="font-bold text-gray-700 md:w-1/4">{cab}</span>
                    <input 
                      type="number" min="0" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-bold text-green-700"
                      placeholder={subType === 'Round Trip' ? "₹ Per KM Rate" : "₹ Amount"}
                      value={cabPrices[cab as keyof typeof cabPrices]?.amount || ''} 
                      onChange={(e) => handleCabPriceChange(cab, 'amount', e.target.value)}
                    />
                    
                    {subType === 'Local Rental' && (
                      <>
                        <input type="number" min="0" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Extra KM (₹)" value={cabPrices[cab as keyof typeof cabPrices]?.extraKm || ''} onChange={(e) => handleCabPriceChange(cab, 'extraKm', e.target.value)} />
                        <input type="number" min="0" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Extra Hour (₹)" value={cabPrices[cab as keyof typeof cabPrices]?.extraHour || ''} onChange={(e) => handleCabPriceChange(cab, 'extraHour', e.target.value)} />
                      </>
                    )}

                    {subType === 'One Way' && (
                      <input type="number" min="0" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Extra KM (₹)" value={cabPrices[cab as keyof typeof cabPrices]?.extraKm || ''} onChange={(e) => handleCabPriceChange(cab, 'extraKm', e.target.value)} />
                    )}

                    {subType === 'Round Trip' && (
                      <input type="number" min="0" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Driver DA / Day (₹)" value={cabPrices[cab as keyof typeof cabPrices]?.driverAllowance || ''} onChange={(e) => handleCabPriceChange(cab, 'driverAllowance', e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">5. Description (Optional Notes)</label>
              <textarea rows={3} className="w-full px-4 py-2 border rounded-lg outline-none resize-none bg-gray-50" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
            </div>

            {/* Inclusions / Exclusions */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">6. Inclusions & Exclusions Setup</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Toll Charges</label>
                  <select className="w-full px-4 py-2 border rounded-lg outline-none" value={tollCharges} onChange={(e) => setTollCharges(e.target.value)}>
                    <option value="Yes">Yes (Included)</option>
                    <option value="No">No (Not Included)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Parking Charges</label>
                  <select className="w-full px-4 py-2 border rounded-lg outline-none" value={parkingCharges} onChange={(e) => setParkingCharges(e.target.value)}>
                    <option value="Yes">Yes (Included)</option>
                    <option value="No">No (Not Included)</option>
                  </select>
                </div>
                {subType !== 'Round Trip' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Driver DA</label>
                    <select className="w-full px-4 py-2 border rounded-lg outline-none" value={driverDa} onChange={(e) => setDriverDa(e.target.value)}>
                      <option value="Yes">Yes (Included)</option>
                      <option value="No">No (Not Included)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-green-700">✅ Additional Inclusions</label>
                    <button type="button" onClick={addCustomIncl} className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-lg hover:bg-green-200">+ Add Item</button>
                  </div>
                  <div className="space-y-3">
                    {customInclusions.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input type="text" className="flex-1 px-4 py-2 border border-green-200 rounded-lg outline-none bg-green-50" value={item} onChange={(e) => handleCustomInclChange(index, e.target.value)} placeholder="e.g. Free Water Bottle" />
                        {customInclusions.length > 1 && (
                          <button type="button" onClick={() => removeCustomIncl(index)} className="text-red-500 font-bold px-2">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-red-700">❌ Additional Exclusions</label>
                    <button type="button" onClick={addCustomExcl} className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-200">+ Add Item</button>
                  </div>
                  <div className="space-y-3">
                    {customExclusions.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <input type="text" className="flex-1 px-4 py-2 border border-red-200 rounded-lg outline-none bg-red-50" value={item} onChange={(e) => handleCustomExclChange(index, e.target.value)} placeholder="e.g. Entry Fees" />
                        {customExclusions.length > 1 && (
                          <button type="button" onClick={() => removeCustomExcl(index)} className="text-red-500 font-bold px-2">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="border border-gray-200 p-6 rounded-xl bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">7. Cab Gallery</h2>
                <button type="button" onClick={addGalleryImage} className="text-sm bg-blue-600 text-white font-bold px-4 py-2 rounded-lg">+ Add Link</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex gap-3">
                    <input type="url" className="flex-1 px-4 py-2 border rounded-lg outline-none" value={url} onChange={(e) => handleGalleryChange(index, e.target.value)} />
                    {gallery.length > 1 && <button type="button" onClick={() => removeGalleryImage(index)} className="text-red-500 font-bold px-2">✕</button>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-bold text-gray-800">8. FAQs</h2>
                <button type="button" onClick={addFaq} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">+ Add FAQ</button>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border relative">
                    {faqs.length > 1 && <button type="button" onClick={() => removeFaq(index)} className="absolute top-4 right-4 text-red-500 text-sm font-bold">✕ Remove</button>}
                    <input type="text" className="w-full px-4 py-2 border rounded-lg bg-white mb-2" value={faq.question} onChange={(e) => handleFaqChange(index, 'question', e.target.value)} placeholder="Question" />
                    <textarea className="w-full px-4 py-2 border rounded-lg bg-white" value={faq.answer} onChange={(e) => handleFaqChange(index, 'answer', e.target.value)} placeholder="Answer"></textarea>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 text-lg">
              {submitting ? 'Saving Changes...' : (editId ? 'Update Cab Service' : 'Submit Cab Service')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddCabListing() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-blue-600">Loading Form...</div>}>
      <CabFormContent />
    </Suspense>
  )
}