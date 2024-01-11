import React, { useEffect, useState } from "react"
import { fetchRoutePatterns } from "../api"
import { RoutePattern } from "../schedule"
import { DiversionPage } from "./detours/diversionPage"
import { useRoute } from "../contexts/routesContext"

export const DummyDetourPage = () => {
  const [routePattern, setRoutePattern] = useState<RoutePattern | null>(null)

  const routeNumber = "66"

  useEffect(() => {
    fetchRoutePatterns(routeNumber).then((routePatterns) => {
      setRoutePattern(routePatterns[0])
    })
  }, [])
  const route = useRoute(routePattern?.routeId)

  return (
    <>
      {routePattern && routePattern.shape && (
        <DiversionPage
          shape={routePattern.shape}
          routeName={routePattern.routeId}
          routeDescription={routePattern.headsign || "?"}
          routeOrigin={routePattern.name}
          routeDirection={
            route?.directionNames[routePattern.directionId] || "?"
          }
        />
      )}
    </>
  )
}
