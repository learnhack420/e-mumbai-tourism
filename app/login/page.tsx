"use client"
import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError || !authData.user) {
      setError('Galat Email ya Password. Kripya dobara try karein.')
      setLoading(false)
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profileData) {
      setError('Profile load karne mein dikkat aayi.')
      setLoading(false)
      return
    }

    if (profileData.role === 'admin') {
      router.push('/admin')
    } 
    else if (profileData.role === 'vendor') {
      if (profileData.approval_status === 'approved') {
        router.push('/vendor') 
      } else {
        await supabase.auth.signOut() 
        setError('Aapka Partner account abhi Pending hai. Admin ke approve karne ke baad aap login kar payenge.')
        setLoading(false)
      }
    } 
    else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6">Welcome Back</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
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

          <div>
            {/* YAHAN NAYA FORGOT PASSWORD LINK ADD KIYA HAI */}
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account? <Link href="/register" className="text-blue-600 font-bold hover:underline">Sign up here</Link>
        </p>
      </div>
    </div>
  )
}