"use client"
import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ loading: false, success: false, error: '' })

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, success: false, error: '' })

    // Supabase ko password reset email bhejney ki request
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password', // Yahan baad mein reset page ka link aayega
    })

    if (error) {
      setStatus({ loading: false, success: false, error: error.message })
    } else {
      setStatus({ loading: false, success: true, error: '' })
      setEmail('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-extrabold text-center text-gray-900 mb-2">Reset Password</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Apna registered email daalein, hum aapko password reset link bhejenge.
        </p>
        
        {status.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {status.error}
          </div>
        )}

        {status.success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
            ✅ Password reset link aapke email par bhej diya gaya hai. Kripya apna inbox check karein.
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="email@example.com"
            />
          </div>

          <button 
            type="submit" 
            disabled={status.loading || status.success}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">
            {status.loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Yaad aa gaya? <Link href="/login" className="text-blue-600 font-bold hover:underline">Wapas Login karein</Link>
        </p>
      </div>
    </div>
  )
}