import { GlobeContainer } from "./components/globe-container"

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* <h1 className="fixed w-full text-center text-7xl md:text-8xl lg:text-9xl 
        text-yellow-500/50 select-none font-serif top-20 z-0
        pointer-events-none">
        Stories of my life
      </h1> */}
      <GlobeContainer />
    </div>
  )
}
