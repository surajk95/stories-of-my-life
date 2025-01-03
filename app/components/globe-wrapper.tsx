'use client'

import dynamic from 'next/dynamic'

const Globe = dynamic(() => import('../globe'), { 
  ssr: false,
  loading: () => <div className="w-full h-screen bg-black" /> 
})

export function GlobeWrapper() {
  return <Globe />
} 