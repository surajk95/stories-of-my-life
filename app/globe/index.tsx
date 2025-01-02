"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import * as TWEEN from "@tweenjs/tween.js"
import markers from "./markers"
import { GlobeConfig, GlobeMarker } from "../types/globe"

const defaultConfig: GlobeConfig = {
  autoRotate: true,
  autoRotateSpeed: 0.5,
  enableZoom: true,
  maxDistance: 400,
  minDistance: 100,
  rotateSpeed: 1,
  markerSize: 1,
  markerColor: "#fcffbe",
  glowColor: "#1a237e",
  darkTheme: true,
  atmosphereColor: "#1a237e"
}

export function Globe({ config = defaultConfig }: { config?: Partial<GlobeConfig> }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedMarker, setSelectedMarker] = useState<GlobeMarker | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      25,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Globe creation
    const globeGeometry = new THREE.SphereGeometry(50, 64, 64)
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load("https://raw.githubusercontent.com/chrisrzhou/react-globe/main/textures/globe_dark.jpg"),
      bumpMap: new THREE.TextureLoader().load("/earth-topology.jpg"),
      bumpScale: 0.5,
      specularMap: new THREE.TextureLoader().load("/earth-specular.jpg"),
      specular: new THREE.Color("#909090"),
      shininess: 5,
    })
    
    const globe = new THREE.Mesh(globeGeometry, globeMaterial)
    scene.add(globe)

    // Atmosphere
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(52, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      })
    )
    scene.add(atmosphere)

    // Add markers
    markers.forEach((marker) => {
      const markerGeometry = new THREE.SphereGeometry(
        config.markerSize || defaultConfig.markerSize!,
        16,
        16
      )
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: marker.color || config.markerColor || defaultConfig.markerColor!,
      })
      const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial)
      
      // Convert lat/long to 3D position
      const lat = marker.coordinates[0] * (Math.PI / 180)
      const lon = marker.coordinates[1] * (Math.PI / 180)
      const radius = 51
      
      markerMesh.position.set(
        radius * Math.cos(lat) * Math.cos(lon),
        radius * Math.sin(lat),
        radius * Math.cos(lat) * Math.sin(lon)
      )
      
      markerMesh.userData = marker
      scene.add(markerMesh)
    })

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(100, 100, 100)
    scene.add(pointLight)

    // Controls
    camera.position.z = 200
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = config.rotateSpeed || defaultConfig.rotateSpeed!
    controls.maxDistance = config.maxDistance || defaultConfig.maxDistance!
    controls.minDistance = config.minDistance || defaultConfig.minDistance!
    controls.autoRotate = config.autoRotate ?? defaultConfig.autoRotate!
    controls.autoRotateSpeed = config.autoRotateSpeed || defaultConfig.autoRotateSpeed!

    // Marker interaction
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function onClick(event: MouseEvent) {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(scene.children)

      for (const intersect of intersects) {
        if (intersect.object.userData?.id) {
          const marker = intersect.object.userData as GlobeMarker
          setSelectedMarker(marker)
          
          // Zoom to marker
          const position = intersect.object.position.clone()
          const distance = 100
          const targetPosition = position.normalize().multiplyScalar(distance)
          
          new TWEEN.Tween(camera.position)
            .to({
              x: targetPosition.x,
              y: targetPosition.y,
              z: targetPosition.z
            }, 1000)
            .easing(TWEEN.Easing.Cubic.Out)
            .start()
            
          break
        }
      }
    }

    window.addEventListener("click", onClick)

    // Animation loop
    function animate() {
      requestAnimationFrame(animate)
      controls.update()
      TWEEN.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      window.removeEventListener("click", onClick)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [config])

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      {selectedMarker && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg">
          <h3 className="text-xl font-bold">{selectedMarker.city}</h3>
          <p className="text-sm text-gray-300">{selectedMarker.country}</p>
          {selectedMarker.description && (
            <p className="mt-2 text-sm">{selectedMarker.description}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Globe