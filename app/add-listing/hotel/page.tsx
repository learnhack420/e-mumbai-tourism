"use client"
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/utils/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import LocationSelector from '../../components/LocationSelector' 

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })
import 'react-quill-new/dist/quill.snow.css'

function HotelFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendorId, setVendorId] = useState('')
  const [userRole, setUserRole] = useState('') 
  const [message, setMessage] = useState({ type: '', text: '' })

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('') 
  const [slugEdited, setSlugEdited] = useState(false) 
  const [city, setCity] = useState('') 
  const [fullAddress, setFullAddress] = useState('')
  const [starRating, setStarRating] = useState('3 Star')
  
  const [roomPrices, setRoomPrices] = useState({
    'Standard Room': '', 'Deluxe Room': '', 'Super Deluxe Room': '', 'Suite': '', 'Family Room': ''
  })
  const [roomCounts, setRoomCounts] = useState({
    'Standard Room': '', 'Deluxe Room': '', 'Super Deluxe Room': '', 'Suite': '', 'Family Room': ''
  })

  const [wifi, setWifi] = useState('Yes')
  const [ac, setAc] = useState('Yes')
  const [breakfast, setBreakfast] = useState('No')
  const [pool, setPool] = useState('No')
  const [parking, setParking] = useState('Yes')

  const [checkIn, setCheckIn] = useState('12:00 PM')
  const [checkOut, setCheckOut] = useState('11:00 AM')
  const [description, setDescription] = useState('')
  const [gallery, setGallery] = useState([''])
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }])

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ]
  }

  useEffect(() => {
    initPage()
  }, [editId])

  async function initPage() {
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

    if (profile.role === 'vendor' && profile.approval_status !== 'approved') {
      router.push('/login')
      return
    }

    setVendorId(session.user.id)
    setUserRole(profile.role)

    if (editId) {
      const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('id', editId)
        .single()

      if (listing) {
        setTitle(listing.title || '')
        setSlug(listing.slug || '')
        setSlugEdited(true)
        setCity(listing.location || listing.metadata?.city || '')
        setFullAddress(listing.metadata?.fullAddress || '')
        
        if (listing.metadata) {
          setStarRating(listing.metadata.starRating || '3 Star')
          if (listing.metadata.roomPrices) setRoomPrices(listing.metadata.roomPrices)
          if (listing.metadata.roomCounts) setRoomCounts(listing.metadata.roomCounts)
          setWifi(listing.metadata.wifi || 'Yes')
          setAc(listing.metadata.ac || 'Yes')
          setBreakfast(listing.metadata.breakfast || 'No')
          setPool(listing.metadata.pool || 'No')
          setParking(listing.metadata.parking || 'Yes')
          setCheckIn(listing.metadata.checkIn || '12:00 PM')
          setCheckOut(listing.metadata.checkOut || '11:00 AM')
          setDescription(listing.metadata.description || listing.description || '')
          if (listing.metadata.gallery && listing.metadata.gallery.length > 0) {
            setGallery(listing.metadata.gallery)
          }
          if (listing.metadata.faqs && listing.metadata.faqs.length > 0) {
            setFaqs(listing.metadata.faqs)
          }
        }
      }
    }

    setLoading(false)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (!slugEdited) {
      const generatedSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') 
        .replace(/(^-|-$)+/g, '')    
      setSlug(generatedSlug)
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const manualSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') 
    setSlug(manualSlug)
    setSlugEdited(true) 
  }

  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...gallery]; newGallery[index] = value; setGallery(newGallery)
  }
  const addGalleryImage = () => setGallery([...gallery, ''])
  const removeGalleryImage = (index: number) => { if (gallery.length > 1) setGallery(gallery.filter((_, i) => i !== index)) }

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs]; newFaqs[index][field] = value; setFaqs(newFaqs)
  }
  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const removeFaq = (index: number) => { if (faqs.length > 1) setFaqs(faqs.filter((_, i) => i !== index)) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!city) {
      setMessage({ type: 'error', text: 'Error: Hotel ki City select karna zaroori hai!' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    const activeRooms = Object.entries(roomPrices).filter(([_, price]) => price.trim() !== '')
    if (activeRooms.length === 0) {
      setMessage({ type: 'error', text: 'Error: Kam se kam ek Room Type ka amount daalna zaroori hai!' })
      setSubmitting(false)
      return
    }
    const lowestPrice = Math.min(...activeRooms.map(([_, price]) => parseFloat(price)))
    
    const formattedRoomPricing = activeRooms.map(([room, price]) => {
      const count = roomCounts[room as keyof typeof roomCounts]
      return `• ${room}: ₹${price} / night (Available Rooms: ${count || 'Not Specified'})`
    }).join('\n')

    let availableAmenities = []
    if (wifi === 'Yes') availableAmenities.push('Free WiFi')
    if (ac === 'Yes') availableAmenities.push('Air Conditioning')
    if (breakfast === 'Yes') availableAmenities.push('Complimentary Breakfast')
    if (pool === 'Yes') availableAmenities.push('Swimming Pool')
    if (parking === 'Yes') availableAmenities.push('Free Parking')

    const cleanGallery = gallery.filter(link => link.trim() !== '')
    const formattedFaqs = faqs.filter(f => f.question.trim() !== '' && f.answer.trim() !== '').map(f => `❓ Q: ${f.question}\n👉 A: ${f.answer}`).join('\n\n') || 'No FAQs provided';

    const detailedDescription = `
🏨 **Hotel Category:** ${starRating} Hotel
⏱️ **Timings:** Check-in: ${checkIn} | Check-out: ${checkOut}

🛏️ **Available Rooms & Pricing:**
${formattedRoomPricing}

✨ **Top Amenities:**
${availableAmenities.join(', ') || 'Standard amenities apply.'}

📝 **About Hotel:**
${description}

💡 **Hotel Policies & FAQs:**
${formattedFaqs}
    `.trim()

    const metadata = {
      starRating, roomPrices, roomCounts, wifi, ac, breakfast, pool, parking, checkIn, checkOut, description, 
      city: city,
      fullAddress: fullAddress,
      gallery: cleanGallery, 
      faqs
    }

    let error;

    if (editId) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: title,
          slug: slug,
          description: detailedDescription,
          location: city,
          price: lowestPrice,
          metadata: metadata
        })
        .eq('id', editId)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('listings')
        .insert([{
          vendor_id: vendorId,
          title: title,
          slug: slug,
          description: detailedDescription,
          category: 'hotel',
          location: city,
          price: lowestPrice,
          status: 'pending',
          metadata: metadata
        }])
      error = insertError
    }

    if (error) {
      if (error.code === '23505') {
        setMessage({ type: 'error', text: 'Error: Yeh SEO Slug pehle se kisi aur hotel ne use kiya hua hai. Kripya thoda alag slug banayein.' })
      } else {
        setMessage({ type: 'error', text: 'Error: ' + error.message })
      }
      setSubmitting(false)
    } else {
      setMessage({ type: 'success', text: editId ? 'Hotel successfully update ho gaya hai!' : 'Hotel successfully add ho gaya hai! Admin approval ke liye bhej diya gaya hai.' })
      setSubmitting(false)
      setTimeout(() => { 
        router.push(userRole === 'admin' ? '/admin' : '/vendor') 
      }, 2000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Loading...</div>

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">{editId ? 'Edit Hotel Property' : 'Add Hotel Property'}</h1>
            <p className="text-blue-100 text-sm mt-1">Apne hotel aur rooms ki details manage karein</p>
          </div>
          <Link href={userRole === 'admin' ? '/admin' : '/vendor'} className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">← Back</Link>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">1. Hotel Information & SEO</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hotel Name</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" value={title} onChange={handleTitleChange} placeholder="e.g. Taj Palace" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SEO URL (Slug)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-200 border border-gray-300 border-r-0 rounded-l-lg text-gray-500 text-sm select-none">
                      /hotel/
                    </span>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-blue-700" 
                      value={slug} 
                      onChange={handleSlugChange} 
                      placeholder="e.g. taj-palace-mumbai" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Star Rating</label>
                  <select className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 h-[42px]" value={starRating} onChange={(e) => setStarRating(e.target.value)}>
                    <option>Homestay / Guest House</option>
                    <option>2 Star</option>
                    <option>3 Star</option>
                    <option>4 Star</option>
                    <option>5 Star</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select City</label>
                  <LocationSelector 
                    label="" 
                    selected={city} 
                    onChange={setCity} 
                    multiple={false}
                    placeholder="Select City..." 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Address / Google Map Link</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white h-[42px]" 
                    value={fullAddress} 
                    onChange={(e) => setFullAddress(e.target.value)} 
                    placeholder="e.g. Near Station or Google Map URL" 
                  />
                </div>
              </div>
            </div>

            {/* 2. Room Types */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h2 className="text-lg font-bold text-blue-900 mb-2">2. Room Types, Pricing & Inventory</h2>
              <div className="grid grid-cols-1 gap-4">
                {Object.keys(roomPrices).map((room) => (
                  <div key={room} className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-blue-200">
                    <span className="font-bold text-gray-700 md:w-1/3">{room}</span>
                    <input 
                      type="number" min="0" className="w-full md:w-1/3 px-3 py-2 border rounded-lg outline-none font-bold text-blue-700" placeholder="₹ Price / night"
                      value={roomPrices[room as keyof typeof roomPrices]} 
                      onChange={(e) => setRoomPrices({...roomPrices, [room]: e.target.value})}
                    />
                    <input 
                      type="number" min="0" className="w-full md:w-1/3 px-3 py-2 border rounded-lg outline-none text-gray-700" placeholder="Total Available Rooms"
                      value={roomCounts[room as keyof typeof roomCounts]} 
                      onChange={(e) => setRoomCounts({...roomCounts, [room]: e.target.value})}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Amenities & Timings */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">3. Amenities & Timings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Free WiFi</label><select className="w-full px-3 py-2 border rounded-md" value={wifi} onChange={(e) => setWifi(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">AC Rooms</label><select className="w-full px-3 py-2 border rounded-md" value={ac} onChange={(e) => setAc(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Breakfast Included</label><select className="w-full px-3 py-2 border rounded-md" value={breakfast} onChange={(e) => setBreakfast(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Swimming Pool</label><select className="w-full px-3 py-2 border rounded-md" value={pool} onChange={(e) => setPool(e.target.value)}><option>Yes</option><option>No</option></select></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Free Parking</label><select className="w-full px-3 py-2 border rounded-md" value={parking} onChange={(e) => setParking(e.target.value)}><option>Yes</option><option>No</option></select></div>
                </div>
                
                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Check-in Time</label>
                    <input type="time" className="w-full px-4 py-2 border rounded-lg bg-white" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Check-out Time</label>
                    <input type="time" className="w-full px-4 py-2 border rounded-lg bg-white" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Gallery */}
            <div className="border border-gray-200 p-6 rounded-xl bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">4. Hotel Gallery (Images)</h2>
                <button type="button" onClick={addGalleryImage} className="text-sm bg-blue-600 text-white font-bold px-4 py-2 rounded-lg">+ Add Image Link</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input type="url" className="flex-1 px-4 py-2 border rounded-lg bg-white" placeholder="Image URL" value={url} onChange={(e) => handleGalleryChange(index, e.target.value)} />
                    {gallery.length > 1 && (<button type="button" onClick={() => removeGalleryImage(index)} className="text-red-500 font-bold px-2">✕</button>)}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">5. Hotel Overview / Description</label>
              <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
                <ReactQuill theme="snow" value={description} onChange={setDescription} modules={quillModules} className="h-40" />
              </div>
              <div className="mt-12"></div>
            </div>

            {/* 6. FAQs */}
            <div>
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-lg font-bold text-gray-800">6. Hotel Policies & FAQs</h2>
                <button type="button" onClick={addFaq} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">+ Add Rule/FAQ</button>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                    {faqs.length > 1 && (<button type="button" onClick={() => removeFaq(index)} className="absolute top-4 right-4 text-red-500 font-bold">✕</button>)}
                    <div className="space-y-3">
                      <input type="text" className="w-full px-4 py-2 border rounded-lg bg-white" value={faq.question} onChange={(e) => handleFaqChange(index, 'question', e.target.value)} placeholder="Question/Rule" />
                      <textarea rows={2} className="w-full px-4 py-2 border rounded-lg bg-white" value={faq.answer} onChange={(e) => handleFaqChange(index, 'answer', e.target.value)} placeholder="Answer/Details"></textarea>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors text-lg shadow-lg">
              {submitting ? 'Saving...' : (editId ? 'Update Hotel Property' : 'Submit Hotel for Approval')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddOrEditHotelListing() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">Loading...</div>}>
      <HotelFormContent />
    </Suspense>
  )
}