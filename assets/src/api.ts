import "whatwg-fetch"
import {
  DirectionName,
  Route,
  RouteId,
  Shape,
  TimepointId,
  TripId,
} from "./schedule.d"

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

interface ShapesForRouteResponse {
  data: Shape[]
}

interface TimepointsForRouteResponse {
  data: TimepointId[]
}

const checkResponseStatus = (response: Response) => {
  if (response.status === 200) {
    return response
  }

  if (Math.floor(response.status / 100) === 3 || response.status === 403) {
    // If the API sends us a redirect or forbidden, the user needs to
    // re-authenticate. Reload to go through the auth flow again.
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
  fetch(`/api/shapes/route/${routeId}`)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: shapes }: ShapesForRouteResponse) => shapes)
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })

export const fetchShapeForTrip = (tripId: TripId): Promise<Shape | null> =>
  fetch(`/api/shapes/trip/${tripId}`)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: shape }: { data: Shape | null }) => shape)
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
