import { MapContainer } from "@/components/map-container"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Geospatial Change Detection</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Monitor and visualize geographical changes including wildfires, natural disasters, and environmental
              impacts using real-time satellite data.
            </p>
          </div>

          <div className="w-full h-[600px] rounded-lg border shadow-sm overflow-hidden">
            <MapContainer />
          </div>
        </div>
      </main>
    </div>
  )
}
