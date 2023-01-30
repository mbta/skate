import { useEffect, useState } from "react"
import { fetchRoutePatterns } from "../api"
import { RouteId, RoutePattern } from "../schedule"

const useRoutePatterns = (routeId: RouteId | null): RoutePattern[] | null => {
  const [routePatterns, setRoutePatterns] = useState<RoutePattern[] | null>(
    null
  )
  useEffect(() => {
    if (routeId === null) {
      setRoutePatterns([])
    } else {
      fetchRoutePatterns(routeId).then(setRoutePatterns)
    }
  }, [routeId])
  return routePatterns
}

export default useRoutePatterns
