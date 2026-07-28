"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MainSearchBox() {
  const router = useRouter()

  // 1. Main Tabs: 'cab', 'tour', 'hotel'
  const [mainTab, setMainTab] = useState('cab')

  // 2. Cab Sub Tabs: 'local', 'outstation'
  const [cabType, setCabType] = useState('local')

  // 3. Cab Nested Tabs
  const [localSubType, setLocalSubType] = useState('point2point') // point2point | rental
  const [outstationSubType, setOutstationSubType] = useState('oneway') // oneway | roundtrip

  // Form States
  const [pickupCity, setPickupCity] = useState('')
  const [dropCity, setDropCity] = useState('')
  const [rentalPackage, setRentalPackage] = useState('8 Hour 80km')
  
  const [tourDestination, setTourDestination] = useState('')
  const [hotelCity, setHotelCity] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Search URL Generation based on Route/City
    let query = `?service=${mainTab}`

    if (mainTab === 'cab') {
      query += `&type=${cabType}`
      if (cabType === 'local') {
        query += `&subType=${localSubType}&city=${pickupCity}`
        if (localSubType === 'point2point') query += `&drop=${dropCity}`
        if (localSubType === 'rental') query += `&package=${rentalPackage}`
      } else {
        query += `&subType=${outstationSubType}&pickup=${pickupCity}&drop=${dropCity}`
      }
    } else if (mainTab === 'tour') {
      query += `&destination=${tourDestination}`
    } else if (mainTab === 'hotel') {
      query += `&city=${hotelCity}`
    }

    router.push(`/search${query}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      
      {/* --- 1. MAIN TABS --- */}
      <div className="flex bg-gray-50 border-b border-gray-200 text-gray-800">
        <button 
          type="button"
          className={`flex-1 py-4 text-center font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${mainTab === 'cab' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setMainTab('cab')}
        >
          🚖 Cab / Taxi
        </button>
        <button 
          type="button"
          className={`flex-1 py-4 text-center font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${mainTab === 'tour' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setMainTab('tour')}
        >
          🗺️ Tour Package
        </button>
        <button 
          type="button"
          className={`flex-1 py-4 text-center font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-colors ${mainTab === 'hotel' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setMainTab('hotel')}
        >
          🏨 Hotel
        </button>
      </div>

      <div className="p-6 md:p-8 text-gray-900">
        <form onSubmit={handleSearch}>
          
          {/* --- CAB SEARCH SECTION --- */}
          {mainTab === 'cab' && (
            <div className="space-y-6">
              
              {/* 2. CAB TYPE (Local / Outstation) */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex bg-gray-100 rounded-full p-1 border border-gray-200">
                  <button type="button" className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${cabType === 'local' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600'}`} onClick={() => setCabType('local')}>
                    🏙️ Local
                  </button>
                  <button type="button" className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${cabType === 'outstation' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600'}`} onClick={() => setCabType('outstation')}>
                    🛣️ Outstation
                  </button>
                </div>
              </div>

              {/* 3. CAB SUB-TYPES */}
              {cabType === 'local' && (
                <div className="flex gap-4 border-b border-gray-100 pb-4">
                  <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
                    <input type="radio" name="localType" checked={localSubType === 'point2point'} onChange={() => setLocalSubType('point2point')} className="w-4 h-4 text-blue-600" />
                    Point 2 Point
                  </label>
                  <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer ml-4">
                    <input type="radio" name="localType" checked={localSubType === 'rental'} onChange={() => setLocalSubType('rental')} className="w-4 h-4 text-blue-600" />
                    Local Rental
                  </label>
                </div>
              )}

              {cabType === 'outstation' && (
                <div className="flex gap-4 border-b border-gray-100 pb-4">
                  <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
                    <input type="radio" name="outstationType" checked={outstationSubType === 'oneway'} onChange={() => setOutstationSubType('oneway')} className="w-4 h-4 text-blue-600" />
                    One Way
                  </label>
                  <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer ml-4">
                    <input type="radio" name="outstationType" checked={outstationSubType === 'roundtrip'} onChange={() => setOutstationSubType('roundtrip')} className="w-4 h-4 text-blue-600" />
                    Round Trip
                  </label>
                </div>
              )}

              {/* 4. DYNAMIC INPUT FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                
                {/* Inputs for Local -> Point 2 Point */}
                {cabType === 'local' && localSubType === 'point2point' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pickup City / Location</label>
                      <input type="text" required placeholder="e.g. Mumbai" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={pickupCity} onChange={e => setPickupCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Drop Location</label>
                      <input type="text" required placeholder="e.g. Andheri East" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={dropCity} onChange={e => setDropCity(e.target.value)} />
                    </div>
                  </>
                )}

                {/* Inputs for Local -> Rental */}
                {cabType === 'local' && localSubType === 'rental' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service City</label>
                      <input type="text" required placeholder="e.g. Pune" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={pickupCity} onChange={e => setPickupCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Package</label>
                      <select className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={rentalPackage} onChange={e => setRentalPackage(e.target.value)}>
                        <option>4 Hour 40km</option>
                        <option>8 Hour 80km</option>
                        <option>12 Hour 120km</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Inputs for Outstation */}
                {cabType === 'outstation' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pickup City</label>
                      <input type="text" required placeholder="From (e.g. Delhi)" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={pickupCity} onChange={e => setPickupCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination City</label>
                      <input type="text" required placeholder="To (e.g. Agra)" className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" value={dropCity} onChange={e => setDropCity(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* --- TOUR PACKAGE SEARCH --- */}
          {mainTab === 'tour' && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Where do you want to go?</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Kerala, Manali, Goa" 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" 
                value={tourDestination} 
                onChange={e => setTourDestination(e.target.value)} 
              />
            </div>
          )}

          {/* --- HOTEL SEARCH --- */}
          {mainTab === 'hotel' && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City or Hotel Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Mumbai, Taj Hotel" 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 font-medium outline-none focus:border-blue-500 text-gray-900 bg-white" 
                value={hotelCity} 
                onChange={e => setHotelCity(e.target.value)} 
              />
            </div>
          )}

          {/* SEARCH BUTTON */}
          <div className="mt-8 text-center">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg px-12 py-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 w-full md:w-auto">
              SEARCH {mainTab.toUpperCase()}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}