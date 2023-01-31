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
    let canceled = false
    if (routeId === null) {
      setRoutePatterns([])
    } else {
      fetchRoutePatterns(routeId).then((routePatterns) => {
        if (!canceled) {
          setRoutePatterns(routePatterns)
        }
      })
    }
    return () => {
      canceled = true
    }
  }, [routeId])

  return routePatterns == null
    ? null
    : routePatterns.reduce((map, rp) => {
        return { ...map, [rp.id]: rp }
      }, {})
}

export default useRoutePatternsById
