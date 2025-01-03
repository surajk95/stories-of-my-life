import { Color } from "three"

export interface GlobeMarker {
  id: string
  place: string
  country: string
  coordinates: [number, number]
  value: number
  color?: string
  description?: string
  date: string
}

export interface GlobeConfig {
  autoRotate?: boolean
  autoRotateSpeed?: number
  enableZoom?: boolean
  maxDistance?: number
  minDistance?: number
  rotateSpeed?: number
  markerSize?: number
  markerColor?: Color | string
  glowColor?: Color | string
  darkTheme?: boolean
  atmosphereColor?: Color | string
} 