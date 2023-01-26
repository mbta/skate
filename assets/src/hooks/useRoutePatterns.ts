import { useEffect, useState } from "react"
import { fetchRoutePatterns } from "../api"
import { RouteId, RoutePattern } from "../schedule"

const useRoutePatterns = (routeId: RouteId): RoutePattern[] | null => {
  const [routePatterns, setRoutePatterns] = useState<RoutePattern[] | null>(
    null
  )
  useEffect(() => {
    fetchRoutePatterns(routeId).then(setRoutePatterns)
  }, [])
  return routePatterns
}

export default useRoutePatterns
