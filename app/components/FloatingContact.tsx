"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

export default function FloatingContact() {
  const [showFormModal, setShowFormModal] = useState(false)
  const [currentPageUrl, setCurrentPageUrl] = useState('')
  
  // Contacts State (Customer aur Vendor ke liye alag numbers)
  const [contactData, setContactData] = useState({
    customerWhatsApp: '919892455466',
    vendorWhatsApp: '919867600452'
  })

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    userType: 'Customer', // Customer or Vendor
    location: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Current page ka URL capture karna
    if (typeof window !== 'undefined') {
      setCurrentPageUrl(window.location.href)
    }
    fetchContactSettings()
  }, [])

  async function fetchContactSettings() {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'contact_helplines')
      .single()

    if (data && data.value) {
      setContactData({
        customerWhatsApp: data.value.customerWhatsApp || data.value.whatsapp || '919867600452',
        vendorWhatsApp: data.value.vendorWhatsApp || data.value.whatsapp || '919867600452'
      })
    }
  }

  const handleOpenForm = () => {
    // Button click hote hi current page ka latest URL bhi update kar lein
    if (typeof window !== 'undefined') {
      setCurrentPageUrl(window.location.href)
    }
    setShowFormModal(true)
  }

  // Form Submit hone par WhatsApp message mein website name aur page URL add ho jayega
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    setSubmitting(false)
    setShowFormModal(false)

    const selectedNumber = formData.userType === 'Vendor' 
      ? contactData.vendorWhatsApp 
      : contactData.customerWhatsApp

    // Professional WhatsApp Message Format with Website Name & Page URL
    const text = `🌐 *Inquiry from India Tour Operators*
----------------------------------------
👤 *Name:* ${formData.name}
👥 *Role:* ${formData.userType}
📞 *Phone:* ${formData.phone}
📍 *Location:* ${formData.location}
🔗 *Page URL:* ${currentPageUrl}
💬 *Message:* ${formData.message}`

    const encodedText = encodeURIComponent(text)
    
    window.open(`https://wa.me/${selectedNumber}?text=${encodedText}`, '_blank')

    // Reset Form
    setFormData({ name: '', phone: '', userType: 'Customer', location: '', message: '' })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Main Single WhatsApp Floating Button */}
      <button 
        onClick={handleOpenForm}
        className="bg-green-600 hover:bg-green-700 text-white font-bold p-4 rounded-full shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
      >
        <span className="text-2xl">💬</span>
        <span className="hidden md:inline pr-1 text-sm">Chat on WhatsApp</span>
      </button>

      {/* LEAD CAPTURE MODAL FORM */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">
                  💬 WhatsApp Inquiry
                </h3>
                <p className="text-xs text-gray-500">India Tour Operators Support</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Name</label>
                <input 
                  type="text" required 
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Enter your full name"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile / WhatsApp Number</label>
                <input 
                  type="tel" required 
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Ex: 9876543210"
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Are you a Customer or Vendor?</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white font-bold text-blue-600"
                  value={formData.userType} 
                  onChange={(e) => setFormData({...formData, userType: e.target.value})}
                >
                  <option value="Customer">Customer (Grahak)</option>
                  <option value="Vendor">Vendor / Partner (Agency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Location / City</label>
                <input 
                  type="text" required 
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Ex: Mumbai, Delhi"
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Message / Query</label>
                <textarea 
                  rows={2} required 
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                  placeholder="Aap kya janna chahte hain?"
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowFormModal(false)}
                  className="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-green-700 shadow-md disabled:bg-green-300"
                >
                  {submitting ? 'Processing...' : 'Start WhatsApp Chat →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}