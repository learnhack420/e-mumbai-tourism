"use client"
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase' // Make sure path is correct

export default function CabBookingSidebar({ cab, meta }: { cab: any, meta: any }) {
  // Modal state ab do tarah ki modals handle karega: 'book' ya 'inquiry'
  const [activeModal, setActiveModal] = useState<'book' | 'inquiry' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false) 
  
  // ==========================================
  // 1. BOOKING FORM STATE & HANDLERS
  // ==========================================
  const [bookData, setBookData] = useState({
    name: '',
    mobile: '',
    date: '',
    time: '',
    pickup: meta.pickupPoint || meta.pickupCity || '',
    drop: meta.dropPoint || meta.dropCity || '',
    selectedCab: ''
  })

  const handleBookChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBookData({ ...bookData, [e.target.name]: e.target.value })
  }

  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const whatsappNumber = "919892455466"
    const tripType = meta.mainType || 'Local'
    const subType = meta.subType || 'Point to Point'

    // 1. Save to DB (Admin Leads)
    const bookingDataPayload = {
      customer_name: bookData.name,
      customer_mobile: bookData.mobile,
      booking_type: 'cab',
      listing_title: cab.title,
      booking_details: {
        tripType: tripType,
        subType: subType,
        date: bookData.date,
        time: bookData.time,
        pickup: bookData.pickup,
        drop: bookData.drop,
        selectedCab: bookData.selectedCab,
        price: cab.price
      }
    }

    const { error } = await supabase.from('bookings').insert([bookingDataPayload])
    if (error) console.error("Booking save error:", error)

    // 🌟 NEW: EMAIL TRIGGER API CALL
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'New Cab Booking Lead', data: bookingDataPayload })
    }).catch(err => console.error("Email bhejte waqt error aaya:", err))

    // Redirect to WhatsApp
    const message = `*New Cab Booking Request* 🚖
    
*Customer Details:*
👤 Name: ${bookData.name}
📞 Mobile: ${bookData.mobile}

*Trip Details:*
🗺️ Type: ${tripType} (${subType})
📅 Date: ${bookData.date}
⏰ Time: ${bookData.time}
📍 Pickup: ${bookData.pickup}
📍 Drop: ${bookData.drop}

*Selected Cab & Price:*
🚘 ${bookData.selectedCab}

Please confirm my booking.`.trim()

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank')
    
    setIsSubmitting(false)
    setActiveModal(null)
  }

  // ==========================================
  // 2. INQUIRY FORM STATE & HANDLERS
  // ==========================================
  const [inquiryData, setInquiryData] = useState({
    name: '',
    mobile: '',
    purpose: ''
  })

  const handleInquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInquiryData({ ...inquiryData, [e.target.name]: e.target.value })
  }

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const whatsappNumber = "919892455466"

    // 1. Save Inquiry to DB (Admin Leads)
    const inquiryPayload = {
      customer_name: inquiryData.name,
      customer_mobile: inquiryData.mobile,
      booking_type: 'cab_inquiry', // Separate type for admin dashboard
      listing_title: cab.title,
      booking_details: {
        requestType: 'Inquiry',
        purpose: inquiryData.purpose,
        pageUrl: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      }
    }

    const { error } = await supabase.from('bookings').insert([inquiryPayload])
    if (error) console.error("Inquiry save error:", error)

    // 🌟 NEW: EMAIL TRIGGER API CALL
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'New Cab Inquiry Alert', data: inquiryPayload })
    }).catch(err => console.error("Email bhejte waqt error aaya:", err))

    // Redirect to WhatsApp
    const message = `*New Cab Inquiry* 💬
    
*Customer Details:*
👤 Name: ${inquiryData.name}
📞 Mobile: ${inquiryData.mobile}

*Inquiring For:* 
🚖 ${cab.title}

*Purpose / Question:*
${inquiryData.purpose}

Kindly provide more details.`.trim()

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank')

    setIsSubmitting(false)
    setActiveModal(null)
  }

  return (
    <>
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-yellow-200 sticky top-24">
        
        {/* Sidebar Section: Trip Info Header */}
        <div className="mb-6 pb-6 border-b border-slate-100 space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Trip Type</span>
            <span className="font-bold text-slate-900">{meta.mainType || 'Local'}</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Service Type</span>
            <span className="font-bold text-slate-900 text-right max-w-[60%]">{meta.subType || 'Point to Point'}</span>
          </div>
        </div>

        {/* Sidebar Section: Available Cabs & Rates */}
        {meta.cabPrices && (
          <div className="mb-8 space-y-4">
            <h4 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Cab cost of {cab.title}</h4>
            {Object.entries(meta.cabPrices).map(([cabType, data]: [string, any]) => {
              if (!data || !data.amount) return null;
              
              return (
                <div key={cabType} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-900 font-bold">{cabType}</span> 
                    <span className="font-black text-yellow-600 text-2xl">
                      ₹{data.amount}
                      {meta.subType === 'Round Trip' && <span className="text-xs text-slate-500 font-medium ml-1">/km</span>}
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-500 font-semibold space-y-1 mt-2 pt-2 border-t border-slate-200">
                    {data.extraKm && <div>Extra KM: <span className="text-slate-700">₹{data.extraKm}/km</span></div>}
                    {data.extraHour && <div>Extra Hour: <span className="text-slate-700">₹{data.extraHour}/hr</span></div>}
                    {data.driverAllowance && <div>Driver DA: <span className="text-slate-700">₹{data.driverAllowance}/day</span></div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sidebar Section: Additional Charges */}
        {meta.nightCharge && (
          <div className="mb-8 space-y-3 border-t border-slate-100 pt-6">
            <h4 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">Additional Charges</h4>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-sm font-bold text-slate-600">Night Charge <br/><span className="text-xs font-medium">(9PM-6AM)</span></span> 
              <span className="font-black text-slate-900 text-lg">₹{meta.nightCharge}</span>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button 
            onClick={() => setActiveModal('inquiry')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 px-4 rounded-xl transition-all shadow-sm active:scale-95"
          >
            💬 Inquiry
          </button>
          <button 
            onClick={() => setActiveModal('book')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            🚖 Book Now
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: BOOKING FORM                      */}
      {/* ========================================== */}
      {activeModal === 'book' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-black">Complete Your Booking</h3>
              <button onClick={() => setActiveModal(null)} className="text-white hover:bg-blue-700 rounded-full p-2 font-bold transition">✕</button>
            </div>

            <form onSubmit={handleBookNow} className="p-6 md:p-8 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name</label>
                  <input type="text" name="name" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500" placeholder="John Doe" onChange={handleBookChange} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                  <input type="tel" name="mobile" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500" placeholder="+91 XXXXX XXXXX" onChange={handleBookChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pickup Date</label>
                  <input type="date" name="date" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500 text-slate-700" onChange={handleBookChange} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pickup Time</label>
                  <input type="time" name="time" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500 text-slate-700" onChange={handleBookChange} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pickup Location</label>
                <input type="text" name="pickup" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500" value={bookData.pickup} onChange={handleBookChange} placeholder="Full Pickup Address" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Drop Location / Destination</label>
                <input type="text" name="drop" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500" value={bookData.drop} onChange={handleBookChange} placeholder="Full Drop Address" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Cab Category</label>
                <select name="selectedCab" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-blue-500 bg-white" onChange={handleBookChange} defaultValue="">
                  <option value="" disabled>Select your cab...</option>
                  {meta.cabPrices && Object.entries(meta.cabPrices).map(([cabType, data]: [string, any]) => {
                    if (!data || !data.amount) return null;
                    return <option key={cabType} value={`${cabType} - ₹${data.amount}`}>{cabType} - ₹{data.amount}</option>
                  })}
                </select>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100">
                <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-yellow-950 font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 text-lg">
                  {isSubmitting ? 'Processing...' : 'Confirm Booking via WhatsApp →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: INQUIRY FORM                      */}
      {/* ========================================== */}
      {activeModal === 'inquiry' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <h3 className="text-xl font-black">Send Inquiry</h3>
              <button onClick={() => setActiveModal(null)} className="text-white hover:bg-slate-700 rounded-full p-2 font-bold transition">✕</button>
            </div>

            <form onSubmit={handleInquirySubmit} className="p-6 md:p-8 space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name</label>
                <input type="text" name="name" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-slate-500" placeholder="John Doe" onChange={handleInquiryChange} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                <input type="tel" name="mobile" required className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-slate-500" placeholder="+91 XXXXX XXXXX" onChange={handleInquiryChange} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose / Your Question</label>
                <textarea name="purpose" required rows={3} className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:border-slate-500 resize-none" placeholder="What details would you like to know?" onChange={handleInquiryChange}></textarea>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100">
                <button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 text-lg">
                  {isSubmitting ? 'Processing...' : 'Send Inquiry via WhatsApp →'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </>
  )
}