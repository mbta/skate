import React, { useEffect, useState } from "react"
import { fetchRoutePatterns } from "../api"
import { DetourMap } from "./detours/detourMap"
import { RoutePattern } from "../schedule"

export const DummyDetourPage = () => {
  const [routePatterns, setRoutePatterns] = useState<RoutePattern[]>([])

  useEffect(() => {
    fetchRoutePatterns("77").then(setRoutePatterns)
  }, [])

  const routePattern = routePatterns[0]

  return (
    <div className="l-page">
      {routePattern && <DetourMap routePattern={routePattern} />}
    </div>
  )
}
