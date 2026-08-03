"use client"
import React, { useState, useEffect } from 'react'

interface SeoAnalyzerProps {
  pageTitle: string
  pageDescription: string
  location?: string
  categoryType: 'hotel' | 'tour' | 'cab' | 'blog' // 🌟 Yeh naya prop add kiya
  metaTitle: string
  setMetaTitle: (val: string) => void
  metaDescription: string
  setMetaDescription: (val: string) => void
  metaKeywords: string
  setMetaKeywords: (val: string) => void
}

export default function SeoAnalyzer({
  pageTitle,
  pageDescription,
  location,
  categoryType,
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  metaKeywords,
  setMetaKeywords
}: SeoAnalyzerProps) {
  
  const [score, setScore] = useState<number>(0)
  const [feedbacks, setFeedbacks] = useState<{ msg: string; passed: boolean }[]>([])
  const [generating, setGenerating] = useState(false)

  // 🌟 REAL AI GENERATION LOGIC
  const handleGenerateAI = async () => {
    if (!pageTitle) {
      alert('Please enter a Title first to generate SEO!')
      return
    }
    setGenerating(true)
    
    try {
      // Direct hamare Next.js AI backend ko call kar rahe hain
      const res = await fetch('/api/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: pageTitle, 
          description: pageDescription,
          location: location,
          categoryType: categoryType // AI ko batayenge ki kya banwana hai
        })
      })
      
      const data = await res.json()
      
      if (data && data.metaTitle) {
        setMetaTitle(data.metaTitle)
        setMetaDescription(data.metaDescription)
        setMetaKeywords(data.metaKeywords)
      } else {
        alert("AI could not generate SEO. Please try again.")
      }

    } catch (error) {
      console.error("AI SEO Error:", error)
      alert("Failed to connect to AI.")
    } finally {
      setGenerating(false)
    }
  }

  // 🌟 SEO Scoring Logic (Runs automatically when data changes)
  useEffect(() => {
    let currentScore = 0
    let checks: { msg: string; passed: boolean }[] = []

    if (metaTitle.length === 0) {
      checks.push({ msg: "Meta Title is missing.", passed: false })
    } else if (metaTitle.length < 30) {
      currentScore += 10
      checks.push({ msg: "Meta Title is too short. Add more details.", passed: false })
    } else if (metaTitle.length > 60) {
      currentScore += 15
      checks.push({ msg: "Meta Title is too long (over 60 chars). Google might truncate it.", passed: false })
    } else {
      currentScore += 25
      checks.push({ msg: "Meta Title length is perfect (30-60 chars).", passed: true })
    }

    if (metaDescription.length === 0) {
      checks.push({ msg: "Meta Description is missing.", passed: false })
    } else if (metaDescription.length < 100) {
      currentScore += 10
      checks.push({ msg: "Meta Description is too short (aim for 150 chars).", passed: false })
    } else if (metaDescription.length > 160) {
      currentScore += 15
      checks.push({ msg: "Meta Description is too long (over 160 chars).", passed: false })
    } else {
      currentScore += 25
      checks.push({ msg: "Meta Description length is perfect (100-160 chars).", passed: true })
    }

    if (metaKeywords.length > 5) {
      currentScore += 15
      const keywordCount = metaKeywords.split(',').length
      if (keywordCount >= 3 && keywordCount <= 8) {
        checks.push({ msg: `Good number of keywords (${keywordCount}).`, passed: true })
        currentScore += 10
      } else {
        checks.push({ msg: "Avoid keyword stuffing. Keep it between 3 to 8 keywords.", passed: false })
      }
    } else {
      checks.push({ msg: "Meta Keywords are missing.", passed: false })
    }

    // Strip HTML tags from Quill description to count real words
    const plainTextDescription = pageDescription ? pageDescription.replace(/<[^>]+>/g, '') : ''
    const wordCount = plainTextDescription.split(/\s+/).filter(word => word.length > 0).length
    
    if (wordCount > 150) {
      currentScore += 25
      checks.push({ msg: `Content length is good (${wordCount} words).`, passed: true })
    } else {
      currentScore += 10
      checks.push({ msg: `Content is too thin (${wordCount} words). Write at least 150 words.`, passed: false })
    }

    setScore(currentScore)
    setFeedbacks(checks)
  }, [metaTitle, metaDescription, metaKeywords, pageDescription])

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }
  const getBgColor = () => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-400'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      {/* Header Section */}
      <div className="bg-slate-900 p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            🚀 SEO Analyzer & AI Generator
          </h2>
          <p className="text-slate-400 text-sm mt-1">Optimize your content to rank #1 on Google</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center bg-slate-800 px-4 py-2 rounded-lg">
            <span className="text-xs text-slate-400 uppercase font-bold">SEO Score</span>
            <span className={`text-2xl font-black ${getScoreColor()}`}>{score}/100</span>
          </div>
          <button 
            type="button" 
            onClick={handleGenerateAI} 
            disabled={generating}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? '⏳ Generating...' : '✨ Auto AI SEO'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2">
        <div className={`h-2 transition-all duration-500 ${getBgColor()}`} style={{ width: `${score}%` }}></div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
              <span>Meta Title</span>
              <span className={`text-xs ${metaTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>{metaTitle.length}/60</span>
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" 
              value={metaTitle} 
              onChange={(e) => setMetaTitle(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Meta Keywords</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" 
              value={metaKeywords} 
              onChange={(e) => setMetaKeywords(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
              <span>Meta Description</span>
              <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{metaDescription.length}/160</span>
            </label>
            <textarea 
              rows={3} 
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none" 
              value={metaDescription} 
              onChange={(e) => setMetaDescription(e.target.value)} 
            />
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">📋 SEO Quality Report</h3>
          <ul className="space-y-3">
            {feedbacks.map((fb, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5">{fb.passed ? '✅' : '⚠️'}</span>
                <span className={fb.passed ? 'text-green-800 font-medium' : 'text-red-700 font-medium'}>
                  {fb.msg}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}