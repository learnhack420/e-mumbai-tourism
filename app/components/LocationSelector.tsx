"use client"
import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

interface Location {
  id: string
  label: string
}

interface LocationSelectorProps {
  label: string
  selected: string | string[]
  onChange: (val: any) => void
  multiple?: boolean
  placeholder?: string
}

export default function LocationSelector({ label, selected, onChange, multiple = false, placeholder }: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  
  // Add new location states
  const [area, setArea] = useState('') // 🌟 NEW: Area or Landmark (Optional)
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('Maharashtra')
  const [country, setCountry] = useState('India')

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    const { data, error } = await supabase.from('locations').select('*').order('label', { ascending: true })
    if (data && !error) setLocations(data)
  }

  const handleSelect = (locLabel: string) => {
    if (multiple) {
      const currentSelected = Array.isArray(selected) ? selected : []
      if (currentSelected.includes(locLabel)) {
        onChange(currentSelected.filter(item => item !== locLabel))
      } else {
        onChange([...currentSelected, locLabel])
      }
    } else {
      onChange(locLabel)
      setIsOpen(false)
    }
  }

  const handleAddLocation = async () => {
    if (!city || !stateName || !country) return alert("City, State aur Country bharna zaroori hai!")
    
    // 🌟 Logic: Agar Area diya hai to use shamil karein, warna sirf City > State > Country
    let newLabel = ''
    if (area.trim()) {
      newLabel = `${area.trim()} > ${city.trim()} > ${stateName.trim()} > ${country.trim()}`
    } else {
      newLabel = `${city.trim()} > ${stateName.trim()} > ${country.trim()}`
    }
    
    const { data, error } = await supabase.from('locations').insert([{ label: newLabel }]).select().single()
    
    if (error) {
      alert("Error saving location. Shayad yeh pehle se add hai.")
    } else if (data) {
      setLocations([...locations, data].sort((a, b) => a.label.localeCompare(b.label)))
      setIsAdding(false)
      setArea('') // Form reset
      setCity('')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if(confirm('Kya aap sach mein is location ko delete karna chahte hain?')) {
      await supabase.from('locations').delete().eq('id', id)
      fetchLocations()
    }
  }

  const selectedArray = Array.isArray(selected) ? selected : (selected ? [selected] : [])

  return (
    <div className="relative w-full">
      <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
      
      {/* Selector Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border rounded-lg bg-gray-50 flex flex-wrap gap-2 items-center cursor-pointer min-h-[42px]"
      >
        {selectedArray.length === 0 && <span className="text-gray-400">{placeholder || 'Select Location...'}</span>}
        
        {selectedArray.map((sel, idx) => (
          <span key={idx} className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            {sel}
            {multiple && (
              <button type="button" onClick={(e) => { e.stopPropagation(); handleSelect(sel) }} className="text-blue-500 hover:text-red-500">✕</button>
            )}
          </span>
        ))}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {locations.map((loc) => (
            <div key={loc.id} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 border-b cursor-pointer" onClick={() => handleSelect(loc.label)}>
              <span className={`text-sm ${selectedArray.includes(loc.label) ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                {selectedArray.includes(loc.label) ? '✓ ' : ''}{loc.label}
              </span>
              <button type="button" onClick={(e) => handleDelete(e, loc.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Delete</button>
            </div>
          ))}

          {/* Add New Section */}
          <div className="p-3 bg-gray-50 border-t">
            {!isAdding ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); setIsAdding(true) }} className="text-sm font-bold text-blue-600 w-full text-center">+ Add New Location</button>
            ) : (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                {/* 🌟 NEW: Area Input Field */}
                <input type="text" placeholder="Area / Landmark (Optional, e.g. Panchavati)" className="w-full px-2 py-1 text-sm border rounded" value={area} onChange={(e) => setArea(e.target.value)} />
                
                <input type="text" placeholder="City (e.g. Nashik)" className="w-full px-2 py-1 text-sm border rounded" value={city} onChange={(e) => setCity(e.target.value)} />
                <input type="text" placeholder="State (e.g. Maharashtra)" className="w-full px-2 py-1 text-sm border rounded" value={stateName} onChange={(e) => setStateName(e.target.value)} />
                <input type="text" placeholder="Country" className="w-full px-2 py-1 text-sm border rounded" value={country} onChange={(e) => setCountry(e.target.value)} />
                
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleAddLocation} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded font-bold flex-1">Save Location</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded font-bold flex-1">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}