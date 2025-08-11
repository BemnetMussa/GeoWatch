"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Satellite } from "lucide-react";
import "leaflet/dist/leaflet.css";

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [L, setL] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState<"satellite" | "terrain">("satellite");
  const [layers, setLayers] = useState<{ [key: string]: any }>({});
  
  const [changeIntensity, setChangeIntensity] = useState(0.5);

  // Load Leaflet dynamically once
  useEffect(() => {
    import("leaflet")
      .then((leafletModule) => setL(leafletModule))
      .catch(console.error);
  }, []);

  // Initialize map once Leaflet loaded and map not created
useEffect(() => {
  if (!L || !mapRef.current || mapInstance) return;

  const map = L.map(mapRef.current).setView([51.505, -0.09], 13);

  const satellite = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  });

  const terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenTopoMap contributors",
  });

  satellite.addTo(map);

  setLayers({ satellite, terrain });
  setMapInstance(map);
}, [L, mapInstance]);


  // Switch tile layers on activeLayer change
useEffect(() => {
  if (!mapInstance) return;
  if (!layers.satellite || !layers.terrain) return;

  if (activeLayer === "satellite") {
    mapInstance.addLayer(layers.satellite);
    mapInstance.removeLayer(layers.terrain);
  } else {
    mapInstance.addLayer(layers.terrain);
    mapInstance.removeLayer(layers.satellite);
  }
}, [activeLayer, mapInstance, layers.satellite, layers.terrain]);


  if (!L) return <div>Loading map library...</div>;

  return (
    <div className="relative w-full h-[600px]">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <Card className="p-2">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4" />
              <span className="text-sm font-medium">Layers</span>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={activeLayer === "satellite" ? "default" : "outline"}
                onClick={() => setActiveLayer("satellite")}
                className="text-xs"
              >
                <Satellite className="h-3 w-3 mr-1" />
                Satellite
              </Button>
              <Button
                size="sm"
                variant={activeLayer === "terrain" ? "default" : "outline"}
                onClick={() => setActiveLayer("terrain")}
                className="text-xs"
              >
                Terrain
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}






















































































































































// import { useEffect, useRef, useState, useCallback } from "react"
// import { Card } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Layers, Zap, AlertTriangle, Satellite, Flame, RefreshCw, Settings, BarChart3 } from "lucide-react"
// import type { RealTimeSettings } from "@/components/real-time-settings"
// import type { NotificationData } from "@/components/notification-system"
// import { InformationDashboard } from "@/components/information-dashboard"
// import type { FireDataResponse, FireHotspot, MapBounds, ChangeDetectionResult } from "@/lib/types"
// import "@preact/signals-react";


// // Map component that will be enhanced with Leaflet
// export function MapContainer() {
//   const mapRef = useRef<HTMLDivElement>(null)
//   const [mapInstance, setMapInstance] = useState<any>(null)
//   const [activeLayer, setActiveLayer] = useState<"satellite" | "terrain">("satellite")
//   const [showFireData, setShowFireData] = useState(true)
//   const [fireData, setFireData] = useState<FireHotspot[]>([])
//   const [isLoadingFires, setIsLoadingFires] = useState(false)
//   const [fireLayerGroup, setFireLayerGroup] = useState<any>(null)
//   const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

//   // Added change detection state
//   const [showChangeDetection, setShowChangeDetection] = useState(false)
//   const [changeResult, setChangeResult] = useState<ChangeDetectionResult | null>(null)
//   const [isAnalyzing, setIsAnalyzing] = useState(false)
//   const [changeLayerGroup, setChangeLayerGroup] = useState<any>(null)
//   const [isAnimating, setIsAnimating] = useState(false)

//   // Added real-time update state
//   const [showRealTimeSettings, setShowRealTimeSettings] = useState(false)
//   const [realTimeSettings, setRealTimeSettings] = useState<RealTimeSettings>({
//     enabled: true,
//     interval: 15, // 15 minutes default
//     notifications: true,
//     autoRefreshOnFocus: true,
//     backgroundSync: true,
//   })
//   const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "error">("connected")
//   const [nextSync, setNextSync] = useState<Date | null>(null)
//   const [updateCount, setUpdateCount] = useState(0)
//   const [notifications, setNotifications] = useState<NotificationData[]>([])
//   const [previousFireData, setPreviousFireData] = useState<FireHotspot[]>([])


//   // Added dashboard state
//   const [showDashboard, setShowDashboard] = useState(false)



//   const [L, setL] = useState<any>(null) // Leaflet namespace after dynamic import

//   // other state declarations...


//   useEffect(() => {
//     import("leaflet").then((leafletModule) => {
//       setL(leafletModule)
//       if (mapRef.current && !mapInstance) {
//         const map = leafletModule.map(mapRef.current).setView([51.505, -0.09], 13)
//         leafletModule
//           .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//             attribution: "© OpenStreetMap contributors",
//           })
//           .addTo(map)
//         setMapInstance(map)
//       }
//     })
//   }, [mapInstance])



//   // Function to switch map layers
//   const switchLayer = useCallback((layer: "satellite" | "terrain") => {
//     setActiveLayer(layer)
//     // Logic to switch layers here
//   }, [])

//   // Function to toggle fire data visibility
//   const toggleFireData = useCallback(() => {
//     setShowFireData(!showFireData)
//   }, [])

//   // Fetch fire data for current map bounds
//   const fetchFireData = useCallback(
//     async (bounds?: MapBounds, isAutoUpdate = false) => {
//       if (!mapInstance) return

//       setIsLoadingFires(true)
//       setConnectionStatus("connected")

//       try {
//         // Get current map bounds if not provided
//         const mapBounds = bounds || mapInstance.getBounds()
//         const queryBounds: MapBounds = bounds || {
//           west: mapBounds.getWest(),
//           south: mapBounds.getSouth(),
//           east: mapBounds.getEast(),
//           north: mapBounds.getNorth(),
//         }

//         const params = new URLSearchParams({
//           west: queryBounds.west.toString(),
//           south: queryBounds.south.toString(),
//           east: queryBounds.east.toString(),
//           north: queryBounds.north.toString(),
//           dayRange: "2", // Get last 2 days of data
//           source: "VIIRS_SNPP_NRT",
//         })

//         const response = await fetch(`/api/fires?${params}`)
//         const result: FireDataResponse = await response.json()

//         if (response.ok) {
//           // Store previous data for comparison
//           if (isAutoUpdate && fireData.length > 0) {
//             setPreviousFireData(fireData)
//             detectNewFires(fireData, result.data)
//           }

//           setFireData(result.data)
//           setLastUpdate(new Date())
//           setUpdateCount((prev) => prev + 1)
//           console.log(`Loaded ${result.count} fire hotspots`)
//         } else {
//           console.error("Failed to fetch fire data:", result.error)
//           setConnectionStatus("error")
//         }
//       } catch (error) {
//         console.error("Error fetching fire data:", error)
//         setConnectionStatus("error")
//       } finally {
//         setIsLoadingFires(false)
//       }
//     },
//     [mapInstance, fireData],
//   )

//   // Added function to detect new fires and create notifications
//   const detectNewFires = useCallback(
//     (oldFires: FireHotspot[], newFires: FireHotspot[]) => {
//       if (!realTimeSettings.notifications) return

//       const PROXIMITY_THRESHOLD = 0.01 // ~1km in degrees
//       const newFiresDetected: FireHotspot[] = []

//       newFires.forEach((newFire) => {
//         const isExisting = oldFires.some((oldFire) => {
//           const distance = Math.sqrt(
//             Math.pow(oldFire.latitude - newFire.latitude, 2) + Math.pow(oldFire.longitude - newFire.longitude, 2),
//           )
//           return distance < PROXIMITY_THRESHOLD
//         })

//         if (!isExisting) {
//           newFiresDetected.push(newFire)
//         }
//       })

//       // Create notifications for new fires
//       newFiresDetected.forEach((fire) => {
//         const notification: NotificationData = {
//           id: `fire_${fire.latitude}_${fire.longitude}_${Date.now()}`,
//           type: "new_fire",
//           title: "New Fire Detected",
//           message: `High confidence fire detected with ${fire.frp} MW power`,
//           timestamp: new Date(),
//           location: { lat: fire.latitude, lng: fire.longitude },
//           severity: fire.confidence > 80 ? "high" : fire.confidence > 60 ? "medium" : "low",
//         }

//         setNotifications((prev) => [notification, ...prev].slice(0, 10)) // Keep last 10 notifications

//         // Browser notification if supported
//         if ("Notification" in window && Notification.permission === "granted") {
//           new Notification("New Fire Detected", {
//             body: notification.message,
//             icon: "/favicon.ico",
//           })
//         }
//       })

//       if (newFiresDetected.length > 0) {
//         console.log(`Detected ${newFiresDetected.length} new fires`)
//       }
//     },
//     [realTimeSettings.notifications],
//   )

//   useEffect(() => {
//     if (mapRef.current) {
//       const map = L.map(mapRef.current).setView([51.505, -0.09], 13)
//       setMapInstance(map)

//       // Add satellite layer
//       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//         attribution: "© OpenStreetMap contributors",
//       }).addTo(map)
//     }
//   }, [])


//   if (!L) return <div>Loading map...</div>

//   return (

//  <div className="relative w-full h-full">
//       <div ref={mapRef} className="w-full h-full" style={{ minHeight: "600px" }} />
   
//       {/* Map controls overlay */}
//       <div className="absolute top-4 left-4 z-[1000] space-y-2">
//         <Card className="p-2">
//           <div className="flex flex-col space-y-2">
//             <div className="flex items-center space-x-2">
//               <Layers className="h-4 w-4" />
//               <span className="text-sm font-medium">Layers</span>
//             </div>
//             <div className="flex space-x-1">
//               <Button
//                 size="sm"
//                 variant={activeLayer === "satellite" ? "default" : "outline"}
//                 onClick={() => switchLayer("satellite")}
//                 className="text-xs"
//               >
//                 <Satellite className="h-3 w-3 mr-1" />
//                 Satellite
//               </Button>
//               <Button
//                 size="sm"
//                 variant={activeLayer === "terrain" ? "default" : "outline"}
//                 onClick={() => switchLayer("terrain")}
//                 className="text-xs"
//               >
//                 Terrain
//               </Button>
//             </div>
//             <div className="pt-1 border-t">
//               <Button
//                 size="sm"
//                 variant={showFireData ? "default" : "outline"}
//                 onClick={toggleFireData}
//                 className="text-xs w-full"
//               >
//                 <Flame className="h-3 w-3 mr-1" />
//                 Fire Data ({fireData.length})
//               </Button>
//             </div>
//           </div>
//         </Card>
//       </div>

//       {/* Status indicators */}
//       <div className="absolute top-4 right-4 z-[1000] space-y-2">
//         <Card className="p-3">
//           <div className="space-y-2">
//             <div className="flex items-center justify-between space-x-2">
//               <Badge variant={fireData.length > 0 ? "default" : "outline"} className="text-xs">
//                 <Zap className="h-3 w-3 mr-1" />
//                 NASA FIRMS
//               </Badge>
//               <Button
//                 size="sm"
//                 variant="ghost"
//                 onClick={() => fetchFireData()}
//                 disabled={isLoadingFires}
//                 className="h-6 w-6 p-0"
//               >
//                 <RefreshCw className={`h-3 w-3 ${isLoadingFires ? "animate-spin" : ""}`} />
//               </Button>
//             </div>
//             <div className="flex items-center space-x-2">
//               <Badge
//                 variant={changeResult ? "default" : "outline"}
//                 className="text-xs cursor-pointer"
//                 onClick={() => setShowChangeDetection(!showChangeDetection)}
//               >
//                 <AlertTriangle className="h-3 w-3 mr-1" />
//                 Change Detection
//               </Badge>
//             </div>
//             {/* Added real-time settings toggle */}
//             <div className="flex items-center space-x-2">
//               <Badge
//                 variant={realTimeSettings.enabled ? "default" : "outline"}
//                 className="text-xs cursor-pointer"
//                 onClick={() => setShowRealTimeSettings(!showRealTimeSettings)}
//               >
//                 <Settings className="h-3 w-3 mr-1" />
//                 Real-time
//               </Badge>
//             </div>
//             {/* Added dashboard toggle */}
//             <div className="flex items-center space-x-2">
//               <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setShowDashboard(true)}>
//                 <BarChart3 className="h-3 w-3 mr-1" />
//                 Analytics
//               </Badge>
//             </div>
//             {lastUpdate && (
//               <div className="text-xs text-muted-foreground">Updated: {lastUpdate.toLocaleTimeString()}</div>
//             )}
//           </div>
//         </Card>
//       </div>

//       {/* Added Information Dashboard */}
//       <InformationDashboard
//         fireData={fireData}
//         changeResult={changeResult}
//         lastUpdate={lastUpdate}
//         isVisible={showDashboard}
//         onClose={() => setShowDashboard(false)}
//       />
//     </div>
//   )
// }
