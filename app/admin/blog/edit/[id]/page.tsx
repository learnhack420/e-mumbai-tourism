"use client"
import { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/utils/supabase' // Path alias use kiya gaya hai (or use '../../../../utils/supabase')
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })
import "react-quill-new/dist/quill.snow.css"

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form States
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(true) // Edit page par usually existing slug retain hota hai
  const [location, setLocation] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [gallery, setGallery] = useState([''])

  // FAQ State
  const [faqItems, setFaqItems] = useState([{ question: "", answer: "" }])

  // Category States
  const [category, setCategory] = useState("Travel Guide")
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [isManagingCategories, setIsManagingCategories] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null)
  const [editingCatName, setEditingCatName] = useState("")

  useEffect(() => {
    // Load saved categories from localStorage
    const savedCats = localStorage.getItem("adminBlogCategories")
    if (savedCats) {
      const parsedCats = JSON.parse(savedCats)
      setAvailableCategories(parsedCats)
    } else {
      setAvailableCategories(["Travel Guide", "Tips & Tricks", "Itinerary", "Food & Culture"])
    }

    fetchBlogDetails()
  }, [resolvedParams.id])

  async function fetchBlogDetails() {
    setLoading(true)
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (error || !data) {
      setMessage({ type: 'error', text: 'Blog not found or failed to load data.' })
      setLoading(false)
      return
    }

    setTitle(data.title || '')
    setSlug(data.slug || '')
    setLocation(data.location || '')
    setLongDescription(data.description || '')

    const meta = data.metadata || {}
    setShortDescription(meta.shortDescription || '')
    setGallery(meta.gallery && meta.gallery.length > 0 ? meta.gallery : [''])
    setFaqItems(meta.faqItems && meta.faqItems.length > 0 ? meta.faqItems : [{ question: "", answer: "" }])
    
    if (meta.blogCategory) {
      setCategory(meta.blogCategory)
    } else {
      setCategory("Travel Guide") // default fallback
    }

    setLoading(false)
  }

  // --- Category Management Functions ---
  const handleAddNewCategory = () => {
    if (newCategory.trim() !== "") {
      const formattedCategory = newCategory.trim()
      const updatedCategories = [...new Set([...availableCategories, formattedCategory])]
      setAvailableCategories(updatedCategories)
      localStorage.setItem("adminBlogCategories", JSON.stringify(updatedCategories))
      setCategory(formattedCategory)
      setNewCategory("")
      setIsAddingCategory(false)
    }
  }

  const handleDeleteCategory = (catToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete "${catToDelete}"?`)) {
      const updatedCategories = availableCategories.filter(c => c !== catToDelete)
      setAvailableCategories(updatedCategories)
      localStorage.setItem("adminBlogCategories", JSON.stringify(updatedCategories))
      if (category === catToDelete) {
        setCategory(updatedCategories[0] || "")
      }
    }
  }

  const startEditingCategory = (index: number, cat: string) => {
    setEditingCatIndex(index)
    setEditingCatName(cat)
  }

  const saveEditedCategory = (index: number, oldCat: string) => {
    const trimmedName = editingCatName.trim()
    if (trimmedName && trimmedName !== oldCat) {
      const updatedCategories = [...availableCategories]
      updatedCategories[index] = trimmedName
      setAvailableCategories(updatedCategories)
      localStorage.setItem("adminBlogCategories", JSON.stringify(updatedCategories))
      if (category === oldCat) {
        setCategory(trimmedName)
      }
    }
    setEditingCatIndex(null)
    setEditingCatName("")
  }

  // --- URL Slug Generator ---
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

  // --- Gallery Handlers ---
  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...gallery]
    newGallery[index] = value
    setGallery(newGallery)
  }

  const handleRemoveGalleryItem = (index: number) => {
    if (gallery.length > 1) {
      setGallery(gallery.filter((_, i) => i !== index))
    }
  }

  // --- FAQ Handlers ---
  const handleFaqChange = (index: number, field: string, value: string) => {
    const newFaqs = [...faqItems]
    newFaqs[index] = { ...newFaqs[index], [field]: value }
    setFaqItems(newFaqs)
  }

  const addFaq = () => setFaqItems([...faqItems, { question: "", answer: "" }])

  const removeFaq = (index: number) => {
    const newFaqs = [...faqItems]
    newFaqs.splice(index, 1)
    setFaqItems(newFaqs)
  }

  // --- Rich Text Editor Handler ---
  const handleDescriptionChange = useCallback((value: string) => {
    setLongDescription(value)
  }, [])

  const quillModules = {
    toolbar: [
      [{ 'header': [2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!category) return alert("Please select or add a category!")
    if (!longDescription || longDescription === '<p><br></p>') {
      return alert("Article content cannot be empty!")
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    const cleanGallery = gallery.filter(link => link.trim() !== '')
    const cleanFaqs = faqItems.filter(f => f.question.trim() !== "" && f.answer.trim() !== "")

    const metadata = {
      shortDescription,
      gallery: cleanGallery,
      blogCategory: category,
      faqItems: cleanFaqs
    }

    const { error } = await supabase
      .from('listings')
      .update({
          title: title,
          slug: slug,
          description: longDescription,
          location: location,
          metadata: metadata
      })
      .eq('id', resolvedParams.id)

    if (error) {
      setMessage({ type: 'error', text: 'Error updating: ' + error.message })
      setSubmitting(false)
    } else {
      setMessage({ type: 'success', text: '✅ Blog article successfully updated!' })
      setSubmitting(false)
      setTimeout(() => { router.push('/admin') }, 2000)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600 text-xl">Loading blog details...</div>

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold">✏️ Edit Blog Article</h1>
            <p className="text-indigo-100 text-sm mt-1">Update SEO details, content, FAQs, and gallery images</p>
          </div>
          <Link href="/admin" className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            ← Back to Admin
          </Link>
        </div>

        <div className="p-6 md:p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-8">
            
            {/* Title & SEO Slug */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">1. Title & Direct URL (Slug)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Blog Title</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 focus:ring-2 focus:ring-indigo-500" value={title} onChange={handleTitleChange} placeholder="e.g. Valley of Flowers Complete Trek Guide" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Root URL Slug</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-200 border border-gray-300 border-r-0 rounded-l-lg text-gray-500 text-sm">/</span>
                    <input type="text" required className="w-full px-4 py-2 border rounded-r-lg outline-none bg-white text-blue-700 font-medium focus:ring-2 focus:ring-indigo-500" value={slug} onChange={handleSlugChange} placeholder="valley-of-flowers" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Location / Tag (e.g., Uttarakhand or Travel Tips)</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 focus:ring-2 focus:ring-indigo-500" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Uttarakhand, India" />
                </div>
              </div>
            </div>

            {/* --- Blog Category Manager --- */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-slate-800">Select Blog Category*</label>
                <button type="button" onClick={() => setIsManagingCategories(!isManagingCategories)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${isManagingCategories ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                  {isManagingCategories ? "Done Managing" : "⚙️ Manage Categories"}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3 items-center">
                {availableCategories.map((cat, index) => {
                  if (isManagingCategories) {
                    if (editingCatIndex === index) {
                      return (
                        <div key={index} className="flex items-center gap-2 bg-indigo-50 p-1.5 rounded-full border border-indigo-200">
                          <input type="text" className="px-3 py-1 rounded-full text-sm outline-none w-32 border" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} autoFocus />
                          <button type="button" onClick={() => saveEditedCategory(index, cat)} className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">Save</button>
                          <button type="button" onClick={() => setEditingCatIndex(null)} className="text-gray-500 px-2 font-bold">✕</button>
                        </div>
                      )
                    }
                    return (
                      <div key={index} className="flex items-center gap-1 bg-white px-3.5 py-1.5 rounded-full border border-slate-300 shadow-sm">
                        <span className="text-sm font-bold text-slate-700 mr-2">{cat}</span>
                        <button type="button" onClick={() => startEditingCategory(index, cat)} className="text-blue-500 text-xs mr-2 font-bold hover:bg-blue-100 p-1 rounded">Edit</button>
                        <button type="button" onClick={() => handleDeleteCategory(cat)} className="text-red-500 text-xs font-bold hover:bg-red-100 p-1 rounded">Del</button>
                      </div>
                    )
                  }

                  const isSelected = category === cat
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-md"
                          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {cat} {isSelected && "✓"}
                    </button>
                  )
                })}

                {!isManagingCategories && (
                  !isAddingCategory ? (
                    <button type="button" onClick={() => setIsAddingCategory(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold border border-dashed border-slate-400 text-slate-500 hover:bg-slate-100 transition-all">
                      + Add New Category
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-300 shadow-sm">
                      <input type="text" className="px-4 py-1.5 rounded-lg outline-none text-sm border" placeholder="New Cat..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} autoFocus />
                      <button type="button" onClick={handleAddNewCategory} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold">Save</button>
                      <button type="button" onClick={() => setIsAddingCategory(false)} className="text-red-500 px-2 font-bold">✕</button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Descriptions & Rich Text */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">2. Article Content</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Short Description (Excerpt / Meta Description)</label>
                  <textarea rows={2} required className="w-full px-4 py-2 border rounded-lg outline-none resize-none bg-gray-50 focus:ring-2 focus:ring-indigo-500" value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="Write a brief 2-line summary for the blog card grid..."></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Article Content (Rich Text)</label>
                  <div className="h-[400px] mb-12">
                    <ReactQuill 
                      theme="snow" 
                      value={longDescription} 
                      onChange={handleDescriptionChange} 
                      modules={quillModules}
                      className="h-[350px]" 
                      placeholder="Write your complete blog article here. You can add links, images, bullet points, and headers..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery / Featured Image */}
            <div className="border border-gray-200 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">3. Featured Image & Gallery URLs</h2>
                <button type="button" onClick={() => setGallery([...gallery, ''])} className="text-sm bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded hover:bg-gray-300">+ Add Image URL</button>
              </div>
              <div className="space-y-3">
                {gallery.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="url" className="w-full px-4 py-2 border rounded-lg outline-none bg-gray-50 focus:ring-2 focus:ring-indigo-500" placeholder="https://images.unsplash.com/photo-..." value={url} onChange={(e) => handleGalleryChange(index, e.target.value)} />
                    {gallery.length > 1 && (
                      <button type="button" onClick={() => handleRemoveGalleryItem(index)} className="text-red-500 font-bold px-3 hover:bg-red-50 rounded-lg">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* --- FAQ Builder --- */}
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">4. ❓ FAQ Builder (Google Schema Ready)</h3>
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border relative shadow-sm flex flex-col gap-2">
                    <input 
                      placeholder="Question (e.g., What is the best time to visit?)" 
                      className="p-2 border-b font-bold outline-none text-sm focus:border-indigo-400" 
                      value={faq.question} 
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)} 
                    />
                    <textarea 
                      placeholder="Answer..." 
                      rows={2} 
                      className="p-2 text-sm outline-none resize-none focus:bg-gray-50 rounded" 
                      value={faq.answer} 
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)} 
                    />
                    <button 
                      type="button" 
                      onClick={() => removeFaq(index)} 
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={addFaq} 
                className="mt-4 bg-white px-4 py-2 rounded-lg text-indigo-600 font-bold text-xs border border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
              >
                + Add More FAQ
              </button>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 text-lg shadow-lg transition-transform transform hover:scale-[1.01]">
              {submitting ? 'Updating Blog...' : 'Update Blog Article'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}