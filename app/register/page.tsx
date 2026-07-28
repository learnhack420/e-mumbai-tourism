"use client"
import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',          // New: Mobile Number
    location: '',       // New: Operating Location (For Vendors)
    role: 'customer'    // Default role customer
  })
  const [status, setStatus] = useState({ loading: false, success: false, error: '', message: '' })
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, success: false, error: '', message: '' })

    // Supabase Auth se naya user create karna aur metadata mein extra fields bhejna
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
          phone: formData.phone,
          location: formData.location
        }
      }
    })

    if (error) {
      setStatus({ loading: false, success: false, error: error.message, message: '' })
    } else {
      // 🌟 NEW: EMAIL TRIGGER API CALL FOR REGISTRATION
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.role === 'vendor' ? 'New Vendor / Partner Registration 🏢' : 'New Customer Registration 👤',
          data: {
            Full_Name: formData.fullName,
            Email: formData.email,
            Phone: formData.phone,
            Account_Type: formData.role.toUpperCase(),
            Operating_Location: formData.location || 'N/A',
            Admin_Action: formData.role === 'vendor' ? 'Pending Approval (Please approve from Admin Panel)' : 'None Required'
          }
        })
      }).catch(err => console.error("Email bhejte waqt error aaya:", err))


      // UI Success Message & Redirect Logic
      let successMsg = 'Registration successful! '
      if (formData.role === 'vendor') {
        successMsg += 'Aapka Partner account abhi Pending hai. Admin ke approve karne ke baad aap login kar payenge.'
      } else {
        successMsg += 'Aap ab login kar sakte hain.'
      }
      
      setStatus({ loading: false, success: true, error: '', message: successMsg })
      
      setTimeout(() => {
        router.push('/login')
      }, 4000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">Create Account</h2>
        <p className="text-center text-gray-500 mb-6">India Tour Operators par aapka swagat hai</p>
        
        {status.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {status.error}
          </div>
        )}

        {status.success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg font-medium">
            ✅ {status.message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          
          {/* 1. Account Type (Role) - Sabse Upar */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Account Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`border p-3 rounded-lg cursor-pointer text-center font-bold transition-colors ${formData.role === 'customer' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                <input type="radio" name="role" className="hidden" value="customer" 
                  checked={formData.role === 'customer'} onChange={() => setFormData({...formData, role: 'customer'})} />
                🙎‍♂️ Customer
              </label>
              
              <label className={`border p-3 rounded-lg cursor-pointer text-center font-bold transition-colors ${formData.role === 'vendor' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                <input type="radio" name="role" className="hidden" value="vendor" 
                  checked={formData.role === 'vendor'} onChange={() => setFormData({...formData, role: 'vendor'})} />
                🏢 Partner / Vendor
              </label>
            </div>
          </div>

          {/* 2. Basic Details */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {formData.role === 'vendor' ? 'Agency / Business Name' : 'Full Name'}
            </label>
            <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
              placeholder={formData.role === 'vendor' ? 'Ex: Raj Travels & Tours' : 'Ex: Rahul Sharma'} />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
              placeholder="email@example.com" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
            <input type="tel" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              placeholder="Ex: 9876543210" />
          </div>

          {/* 3. Operating Location (Sirf Vendor ke liye dikhega) */}
          {formData.role === 'vendor' && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fadeIn">
              <label className="block text-sm font-bold text-blue-900 mb-1">Operating City / Location</label>
              <input type="text" required className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} 
                placeholder="Ex: Kochi, Kerala or Mumbai" />
              <p className="text-xs text-blue-600 mt-1">Aap kis sheher se apni services operate karte hain?</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
              placeholder="Minimum 6 characters" />
          </div>

          <button type="submit" disabled={status.loading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 mt-4 shadow-lg">
            {status.loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  )
}