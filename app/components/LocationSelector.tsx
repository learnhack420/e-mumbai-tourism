"use client"
import React, { useState, useEffect, useMemo } from 'react'
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

const DEFAULT_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir'
]

export default function LocationSelector({ label, selected, onChange, multiple = false, placeholder }: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  // Smart Inline Add States
  const [isInlineAdding, setIsInlineAdding] = useState(false)
  const [areaInput, setAreaInput] = useState('') // Optional Area/Landmark
  const [cityInput, setCityInput] = useState('') // City name
  const [stateName, setStateName] = useState('Maharashtra')
  const [country, setCountry] = useState('India')
  const [stateSearchOpen, setStateSearchOpen] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    const { data, error } = await supabase.from('locations').select('*').order('label', { ascending: true })
    if (data && !error) setLocations(data)
  }

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => 
      loc.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [locations, search])

  const filteredStates = useMemo(() => {
    return DEFAULT_STATES.filter(s => 
      s.toLowerCase().includes(stateName.toLowerCase())
    )
  }, [stateName])

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

  // Smart trigger jab koi search item na mile
  const startSmartAdd = (query: string) => {
    setCityInput(query) // jo search kiya tha use city maan kar pre-fill kar diya
    setAreaInput('')
    setIsInlineAdding(true)
  }

  const handleSaveInlineLocation = async () => {
    if (!cityInput.trim() || !stateName.trim() || !country.trim()) {
      return alert("City, State aur Country bharna zaroori hai!")
    }
    
    // Format: Area > City > State > Country (Agar area diya ho) warna City > State > Country
    let newLabel = ''
    if (areaInput.trim()) {
      newLabel = `${areaInput.trim()} > ${cityInput.trim()} > ${stateName.trim()} > ${country.trim()}`
    } else {
      newLabel = `${cityInput.trim()} > ${stateName.trim()} > ${country.trim()}`
    }
    
    const { data, error } = await supabase.from('locations').insert([{ label: newLabel }]).select().single()
    
    if (error) {
      alert("Error saving location. Shayad yeh pehle se add hai.")
    } else if (data) {
      const updatedList = [...locations, data].sort((a, b) => a.label.localeCompare(b.label))
      setLocations(updatedList)
      handleSelect(data.label) // Automatically select the newly added location!
      setIsInlineAdding(false)
      setSearch('')
      setCityInput('')
      setAreaInput('')
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
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-72 overflow-y-auto flex flex-col">
          
          {/* SEARCH BAR (Always on Top for quick lookup) */}
          <div className="p-2 border-b bg-gray-50 sticky top-0 z-20">
            <input 
              type="text" 
              placeholder="🔍 Search city (e.g. Khandala)..." 
              className="w-full px-3 py-1.5 text-sm border rounded-md outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (isInlineAdding) setIsInlineAdding(false)
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* SMART INLINE ADD FORM (Agar search karne par location na mile) */}
          {isInlineAdding ? (
            <div className="p-3 bg-blue-50 border-b space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="text-xs font-bold text-blue-800">
                ✨ Add new location matching "<span className="underline">{search}</span>":
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold">Area / Landmark (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lonavala Station"
                  className="w-full px-2 py-1 text-sm border rounded bg-white text-black" 
                  value={areaInput} 
                  onChange={(e) => setAreaInput(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="text-[10px] text-gray-500 font-bold">City / Destination *</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 text-sm border rounded bg-white text-black" 
                  value={cityInput} 
                  onChange={(e) => setCityInput(e.target.value)} 
                />
              </div>

              <div className="relative">
                <label className="text-[10px] text-gray-500 font-bold">State *</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 text-sm border rounded bg-white text-black" 
                  value={stateName} 
                  onChange={(e) => {
                    setStateName(e.target.value)
                    setStateSearchOpen(true)
                  }}
                  onFocus={() => setStateSearchOpen(true)}
                />
                {stateSearchOpen && filteredStates.length > 0 && (
                  <div className="absolute z-30 w-full bg-white border rounded shadow-md max-h-28 overflow-y-auto mt-1">
                    {filteredStates.map((st) => (
                      <div 
                        key={st} 
                        className="px-3 py-1 text-xs hover:bg-blue-50 cursor-pointer text-gray-700 font-medium"
                        onClick={() => {
                          setStateName(st)
                          setStateSearchOpen(false)
                        }}
                      >
                        {st}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold">Country *</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 text-sm border rounded bg-white text-black" 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)} 
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleSaveInlineLocation} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded font-bold flex-1">Save & Select</button>
                <button type="button" onClick={() => setIsInlineAdding(false)} className="bg-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded font-bold flex-1">Cancel</button>
              </div>
            </div>
          ) : null}

          {/* LOCATION LIST */}
          <div className="overflow-y-auto flex-1">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((loc) => (
                <div key={loc.id} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 border-b cursor-pointer" onClick={() => handleSelect(loc.label)}>
                  <span className={`text-sm ${selectedArray.includes(loc.label) ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                    {selectedArray.includes(loc.label) ? '✓ ' : ''}{loc.label}
                  </span>
                  <button type="button" onClick={(e) => handleDelete(e, loc.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Delete</button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">No location found matching "{search}"</p>
                {search.trim() && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); startSmartAdd(search.trim()) }}
                    className="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm"
                  >
                    + Add "{search.trim()}" as New Location
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}