import { useEffect, useState } from "react"
import { fetchRoutePatterns } from "../api"
import { ByRoutePatternId, RouteId, RoutePattern } from "../schedule"

const useRoutePatternsById = (
  routeId: RouteId | null
): ByRoutePatternId<RoutePattern> | null => {
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

  return routePatterns == null
    ? null
    : routePatterns.reduce((map, rp) => {
        return { ...map, [rp.id]: rp }
      }, {})
}

export default useRoutePatternsById
