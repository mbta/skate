import { Route, RouteId } from "../schedule.d"

export const routeNameOrId = (
  routeId: RouteId | null,
  routes: Route[] | null
): string => {
  if (routeId === null) {
    return ""
  }

  const matchingRoute = routes && routes.find((route) => route.id === routeId)
  return matchingRoute ? matchingRoute.name : routeId
}
