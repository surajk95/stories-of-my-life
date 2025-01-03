"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import * as TWEEN from "@tweenjs/tween.js"
import markers from "./markers"
import { GlobeConfig, GlobeMarker } from "../types/globe"

const defaultConfig: GlobeConfig = {
  autoRotate: true,
  autoRotateSpeed: 0.10,
  enableZoom: true,
  maxDistance: 200,
  minDistance: 100,
  rotateSpeed: 1,
  markerSize: 1,
  markerColor: "#fcffbe",
  glowColor: "#1a237e",
  darkTheme: true,
  atmosphereColor: "#1a237e"
}

interface GlobeProps {
  selectedMarker: GlobeMarker | null
  onMarkerSelect: (marker: GlobeMarker | null) => void
  config?: Partial<GlobeConfig>
}

function createGlowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        float glow = (sin(time * 2.0) * 0.5 + 0.5) * 0.8 + 0.2;
        gl_FragColor = vec4(1.0, 1.0, 0.8, intensity * glow);
      }
    `,
    blending: THREE.AdditiveBlending,
    transparent: true,
    side: THREE.FrontSide
  })
}

function Globe({ selectedMarker, onMarkerSelect, config = defaultConfig }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Remove any existing canvas elements first
    const existingCanvas = containerRef.current.querySelector('canvas')
    if (existingCanvas) {
      existingCanvas.remove()
    }

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      25,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    cameraRef.current = camera
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    containerRef.current.appendChild(renderer.domElement)

    // Globe creation
    const globeGeometry = new THREE.SphereGeometry(50, 64, 64)
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load("https://raw.githubusercontent.com/chrisrzhou/react-globe/main/textures/globe_dark.jpg"),
      // bumpMap: new THREE.TextureLoader().load("/earth-topology.jpg"),
      bumpScale: 0.5,
      // specularMap: new THREE.TextureLoader().load("/earth-specular.jpg"),
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

      // Generate random vibrant color for the marker
      const hue = Math.random()
      const saturation = 0.7 + Math.random() * 0.3
      const lightness = 0.5 + Math.random() * 0.2
      const color = new THREE.Color().setHSL(hue, saturation, lightness)

      const markerMaterial = new THREE.MeshBasicMaterial({
        color: color
      })
      
      const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial)
      
      // Add glow effect
      const glowGeometry = new THREE.SphereGeometry(
        (config.markerSize || defaultConfig.markerSize!) * 2,
        16,
        16
      )
      const glowMaterial = createGlowMaterial()
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
      
      // Group marker and its glow
      const markerGroup = new THREE.Group()
      markerGroup.add(markerMesh)
      markerGroup.add(glowMesh)
      
      // Convert lat/long to 3D position
      const latitude = marker.coordinates[0]
      const longitude = marker.coordinates[1]
      const radius = 51

      const latRad = latitude * (Math.PI / 180)
      const lonRad = -longitude * (Math.PI / 180)
      
      markerGroup.position.set(
        radius * Math.cos(latRad) * Math.cos(lonRad),
        radius * Math.sin(latRad),
        radius * Math.cos(latRad) * Math.sin(lonRad)
      )
      
      markerGroup.userData = marker
      markerMesh.userData = marker // Keep this for raycasting
      scene.add(markerGroup)
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
      const intersects = raycaster.intersectObjects(scene.children, true)

      let foundMarker = false
      for (const intersect of intersects) {
        const markerData = intersect.object.userData?.id ? 
          intersect.object.userData : 
          intersect.object.parent?.userData;

        if (markerData?.id) {
          foundMarker = true
          const marker = markerData as GlobeMarker
          console.log('zzz Found marker:', marker)
          onMarkerSelect(marker)
          
          const position = intersect.object.parent?.position.clone() || intersect.object.position.clone()
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

      if (!foundMarker) {
        onMarkerSelect(null)
      }
    }

    window.addEventListener("click", onClick)

    // Animation loop
    function animate() {
      requestAnimationFrame(animate)
      
      // Update glow shader time uniform and marker scales
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) {
          if (object.material.uniforms?.time) {
            object.material.uniforms.time.value = performance.now() / 1000
          }
        }
        
        // Scale markers based on camera distance
        if (object instanceof THREE.Group && object.userData?.id) {
          const distance = camera.position.distanceTo(object.position)
          const scale = distance / 200 // Adjust 200 to change the base scale
          object.scale.setScalar(scale)
        }
      })
      
      controls.update()
      TWEEN.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      window.removeEventListener("click", onClick)
      
      // Dispose of all THREE.js resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (object.material instanceof THREE.Material) {
            object.material.dispose()
          } else if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          }
        }
      })
      
      renderer.dispose()
      
      // Remove the canvas
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [config])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}

export default Globe