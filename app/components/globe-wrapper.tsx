'use client'

import dynamic from 'next/dynamic'
import { GlobeMarker, GlobeConfig } from '../types/globe'

interface GlobeWrapperProps {
  selectedMarker: GlobeMarker | null
  onMarkerSelect: (marker: GlobeMarker | null) => void
  config?: Partial<GlobeConfig>
}

const Globe = dynamic(() => import('../globe'), { 
  ssr: false,
  loading: () => <div className="w-full h-screen bg-black" /> 
})

export function GlobeWrapper(props: GlobeWrapperProps) {
  return <Globe {...props} />
} 