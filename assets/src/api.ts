import "whatwg-fetch"
import { DirectionName, Route, RouteId, Shape, TimepointId } from "./schedule.d"

interface RoutesResponse {
  data: RouteData[]
}

interface RouteData {
  id: string
  direction_names: {
    "0": DirectionName
    "1": DirectionName
  }
  name: string
}

interface ShapesFroRouteResponse {
  data: Shape[]
}

interface TimepointsForRouteResponse {
  data: TimepointId[]
}

const checkResponseStatus = (response: Response) => {
  if (response.status === 200) {
    return response
  }

  if (Math.floor(response.status / 100) === 3) {
    // If the API sends us a redirect, the user needs to re-authenticate.
    // Reload to go through the auth flow again.
    window.location.reload(true)
  }

  throw new Error(`Response error: ${response.status}`)
}

const parseJson = (response: Response) => response.json()

const parseRouteData = ({ id, direction_names, name }: RouteData): Route => ({
  id,
  directionNames: direction_names,
  name,
})

const parseRoutesData = (routesData: RouteData[]): Route[] =>
  routesData.map(parseRouteData)

export const fetchRoutes = (): Promise<Route[]> =>
  fetch("/api/routes")
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: routes }: RoutesResponse) => parseRoutesData(routes))
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })

export const fetchShapeForRoute = (routeId: RouteId): Promise<Shape[]> =>
  fetch(`/api/shapes/${routeId}`)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: shapes }: ShapesFroRouteResponse) => shapes)
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })

export const fetchShuttleRoutes = (): Promise<Route[]> =>
  fetch("/api/shuttles")
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: shuttles }: RoutesResponse) => parseRoutesData(shuttles))
    .catch(error => {
      throw error
    })

export const fetchTimepointsForRoute = (
  routeId: RouteId
): Promise<TimepointId[]> =>
  fetch(`/api/routes/${routeId}`)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: timepointIds }: TimepointsForRouteResponse) => timepointIds)
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })
