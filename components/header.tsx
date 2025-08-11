import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Satellite, Activity, MapPin } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Satellite className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">GeoWatch</span>
            <Badge variant="secondary" className="ml-2">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              Wildfire Data
            </Button>
            <Button variant="ghost" size="sm">
              Change Detection
            </Button>
            <Button variant="ghost" size="sm">
              About
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
