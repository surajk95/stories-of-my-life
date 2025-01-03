'use client'

import { ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import markers from "@/app/globe/markers"
import { GlobeMarker } from "@/app/types/globe"

interface TimelineDrawerProps {
  selectedMarkerId?: string | null
  onMarkerSelect?: (marker: GlobeMarker) => void
}

export function TimelineDrawer({ selectedMarkerId, onMarkerSelect }: TimelineDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const selectedRef = useRef<HTMLDivElement>(null)

  // Expand drawer and scroll to marker when selected
  useEffect(() => {
    if (selectedMarkerId) {
      setIsExpanded(true)
      selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedMarkerId])

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-white transition-all duration-300 border-t border-white/10",
        isExpanded ? "h-64" : "h-16",
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm 
          px-4 py-1 rounded-t-lg border border-white/10 border-b-0 hover:bg-black/90 
          transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-white/80" />
        ) : (
          <ChevronUp className="h-4 w-4 text-white/80" />
        )}
      </button>

      {isExpanded ? (
        <div className="h-full overflow-x-auto">
          <div className="p-4">
            <h2 className="font-medium text-lg mb-4">Timeline</h2>
            <div className="flex space-x-4 min-w-max">
              {markers.map((marker) => (
                <div 
                  key={marker.id}
                  ref={marker.id === selectedMarkerId ? selectedRef : null}
                  onClick={() => onMarkerSelect?.(marker)}
                  className={cn(
                    "flex items-center gap-4 p-2 rounded-lg transition-colors w-72 cursor-pointer",
                    marker.id === selectedMarkerId 
                      ? "bg-white/10 ring-1 ring-white/20" 
                      : "hover:bg-white/5"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    {marker.id.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{marker.place}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{marker.country}</span>
                      <span>•</span>
                      <span>{marker.date}</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{marker.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <h2 className="font-medium text-lg">Timeline</h2>
        </div>
      )}
    </div>
  )
} 