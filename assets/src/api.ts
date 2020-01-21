import "whatwg-fetch"
import {
  DirectionName,
  Route,
  RouteId,
  Shape,
  TimepointId,
  TripId,
} from "./schedule.d"

interface RouteData {
  id: string
  direction_names: {
    "0": DirectionName
    "1": DirectionName
  }
  name: string
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

export const apiCall = <T>(url: string, parser: (data: any) => T): Promise<T> =>
  fetch(url)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: data }: { data: any }) => parser(data))
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })

const parseRouteData = ({ id, direction_names, name }: RouteData): Route => ({
  id,
  directionNames: direction_names,
  name,
})

const parseRoutesData = (routesData: RouteData[]): Route[] =>
  routesData.map(parseRouteData)

export const fetchRoutes = (): Promise<Route[]> =>
  apiCall("/api/routes", parseRoutesData)

export const fetchShapeForRoute = (routeId: RouteId): Promise<Shape[]> =>
  apiCall(`/api/shapes/route/${routeId}`, (shapes: Shape[]) => shapes)

export const fetchShapeForTrip = (tripId: TripId): Promise<Shape | null> =>
  apiCall(`/api/shapes/trip/${tripId}`, (shape: Shape | null) => shape)

export const fetchShuttleRoutes = (): Promise<Route[]> =>
  apiCall("/api/shuttles", parseRoutesData)

export const fetchTimepointsForRoute = (
  routeId: RouteId
): Promise<TimepointId[]> =>
  apiCall(
    `/api/routes/${routeId}`,
    (timepointIds: TimepointId[]) => timepointIds
  )
