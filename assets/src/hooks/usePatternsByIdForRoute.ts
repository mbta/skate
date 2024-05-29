import { useCallback } from "react"
import { fetchRoutePatterns } from "../api"
import { ByRoutePatternId, RouteId, RoutePattern } from "../schedule"
import { useApiCall } from "./useApiCall"

/**
 * It may be useful to export this at some point in the future,
 * right now {@linkcode usePatternsByIdForRoute} has a nicer interface,
 * unless you need a list.
 */
const usePatternsForRoute = (routeId: RouteId | undefined) =>
  useApiCall({
    apiCall: useCallback(async () => {
      if (routeId === undefined) {
        return null
      }

      return fetchRoutePatterns(routeId)
    }, [routeId]),
  })

const usePatternsByIdForRoute = (
  routeId: RouteId | null
): ByRoutePatternId<RoutePattern> | null => {
  const { result: routePatterns } = usePatternsForRoute(routeId ?? undefined)

  if (routePatterns === undefined || routePatterns === null) {
    return null
  }

  return Object.fromEntries(routePatterns.map((rp) => [rp.id, rp]))
}

export default usePatternsByIdForRoute
