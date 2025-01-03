'use client'

import { useState } from 'react'
import { GlobeWrapper } from './globe-wrapper'
import { GlobeMarker } from '../types/globe'
import { TimelineDrawer } from './timeline-drawer'

export function GlobeContainer() {
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(null)

  const handleMarkerSelect = (marker: GlobeMarker | null) => {
    setSelectedMarker(marker)
  }

  return (
    <div className="relative w-full h-screen">
      <GlobeWrapper 
        selectedMarker={selectedMarker} 
        onMarkerSelect={handleMarkerSelect} 
      />
      <TimelineDrawer 
        selectedMarkerId={selectedMarker?.id} 
        onMarkerSelect={setSelectedMarker}
      />
    </div>
  )
} 