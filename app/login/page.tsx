"use client"
import { useState } from 'react'
import { supabase } from '../../utils/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Status state ko thoda advance kar diya hai taaki success animation dikha sakein
  const [status, setStatus] = useState({ loading: false, success: false, error: '', message: '', redirectUrl: '' })
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ loading: true, success: false, error: '', message: '', redirectUrl: '' })

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError || !authData.user) {
      setStatus({ loading: false, success: false, error: 'Galat Email ya Password. Kripya dobara try karein.', message: '', redirectUrl: '' })
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profileData) {
      setStatus({ loading: false, success: false, error: 'Profile load karne mein dikkat aayi.', message: '', redirectUrl: '' })
      return
    }

    // Role ke hisaab se redirection aur success animation
    let targetUrl = '/'
    let welcomeMsg = 'Login successful! Taking you to the beach...'

    if (profileData.role === 'admin') {
      targetUrl = '/admin'
      welcomeMsg = 'Welcome Admin! Opening Control Panel...'
    } 
    else if (profileData.role === 'vendor') {
      if (profileData.approval_status === 'approved') {
        targetUrl = '/vendor'
        welcomeMsg = 'Welcome Partner! Opening your dashboard...'
      } else {
        await supabase.auth.signOut() 
        setStatus({ loading: false, success: false, error: 'Aapka Partner account abhi Pending hai. Admin ke approve karne ke baad aap login kar payenge.', message: '', redirectUrl: '' })
        return
      }
    } 

    // Show Success Animation before redirecting
    setStatus({ loading: false, success: true, error: '', message: welcomeMsg, redirectUrl: targetUrl })
    
    setTimeout(() => {
      router.push(targetUrl)
    }, 2500) // 2.5 seconds baad redirect
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-sky-300 via-cyan-200 to-orange-100 p-4 font-sans">
      
      {/* Custom CSS for Beach Theme Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes sun-glow {
          0%, 100% { box-shadow: 0 0 40px rgba(253, 224, 71, 0.6); }
          50% { box-shadow: 0 0 80px rgba(253, 224, 71, 1); }
        }
        .animate-sway { animation: sway 4s ease-in-out infinite; transform-origin: bottom center; }
        .animate-sway-slow { animation: sway 6s ease-in-out infinite; transform-origin: bottom center; animation-delay: 1s; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 5s ease-in-out infinite; animation-delay: 2s; }
        .sun-glow { animation: sun-glow 4s ease-in-out infinite; }
      `}} />

      {/* --- ANIMATED BACKGROUND ELEMENTS --- */}
      {/* Sun */}
      <div className="absolute top-10 right-10 md:top-20 md:right-32 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-yellow-200 to-orange-400 rounded-full sun-glow"></div>
      
      {/* Clouds */}
      <div className="absolute top-20 left-10 md:left-32 text-6xl opacity-80 animate-float">☁️</div>
      <div className="absolute top-32 right-1/4 text-5xl opacity-60 animate-float-delayed">☁️</div>
      
      {/* Ocean / Waves */}
      <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-blue-500/80 to-cyan-400/30 backdrop-blur-sm border-t border-white/20"></div>

      {/* Coconut Trees */}
      <div className="absolute -bottom-5 left-2 md:left-10 text-8xl md:text-[10rem] animate-sway">🌴</div>
      <div className="absolute bottom-0 right-5 md:right-20 text-7xl md:text-[8rem] animate-sway-slow">🌴</div>
      <div className="absolute bottom-5 right-2 md:right-10 text-5xl md:text-[6rem] animate-sway opacity-80">🌴</div>


      {/* --- LOGIN CARD (GLASSMORPHISM) --- */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-8 border border-white/50">
        
        {/* SUCCESS SCREEN */}
        {status.success ? (
          <div className="text-center py-10 animate-float">
            <div className="text-7xl mb-6 animate-bounce">🌊🌴</div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-4">
              Welcome Back!
            </h2>
            <p className="text-slate-700 font-bold mb-8 leading-relaxed text-lg">
              {status.message}
            </p>
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-cyan-600 font-bold animate-pulse">Redirecting to dashboard...</p>
          </div>
        ) : (
          /* FORM SCREEN */
          <>
            <h2 className="text-3xl font-black text-center text-slate-800 mb-2 drop-shadow-sm">Welcome Back</h2>
            <p className="text-center text-slate-500 mb-8 font-medium">Please login to your account 🏖️</p>
            
            {status.error && (
              <div className="mb-6 p-3 bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 text-sm rounded-xl font-medium shadow-sm">
                ⚠️ {status.error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-slate-800 font-medium placeholder-slate-400 shadow-sm"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-bold text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-sm font-black text-cyan-600 hover:text-cyan-700 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input 
                  type="password" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-white/60 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cyan-400 outline-none transition-all text-slate-800 font-medium placeholder-slate-400 shadow-sm"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={status.loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-black py-4 px-4 rounded-xl transition-all disabled:opacity-70 mt-6 shadow-lg shadow-cyan-500/30 transform hover:-translate-y-1">
                {status.loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                    Logging in...
                  </span>
                ) : 'Login Now'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600 mt-8 font-medium">
              Don't have an account? <Link href="/register" className="text-cyan-600 font-black hover:underline ml-1">Sign up here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}