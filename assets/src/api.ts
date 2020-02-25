import "whatwg-fetch"
import { reload } from "./models/browser"
import {
  DirectionName,
  Route,
  RouteId,
  Shape,
  Timepoint,
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
    reload(true)
  }

  throw new Error(`Response error: ${response.status}`)
}

const parseJson = (response: Response) => response.json()

export const apiCall = <T>({
  url,
  parser,
  defaultResult,
}: {
  url: string
  parser: (data: any) => T
  defaultResult?: T
}): Promise<T> =>
  fetch(url)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: data }: { data: any }) => parser(data))
    .catch(error => {
      if (defaultResult === undefined) {
        throw error
      } else {
        return defaultResult
      }
    })

const parseRouteData = ({ id, direction_names, name }: RouteData): Route => ({
  id,
  directionNames: direction_names,
  name,
})

const parseRoutesData = (routesData: RouteData[]): Route[] =>
  routesData.map(parseRouteData)

export const fetchRoutes = (): Promise<Route[]> =>
  apiCall({
    url: "/api/routes",
    parser: parseRoutesData,
  })

export const fetchShapeForRoute = (routeId: RouteId): Promise<Shape[]> =>
  apiCall({
    url: `/api/shapes/route/${routeId}`,
    parser: (shapes: Shape[]) => shapes,
    defaultResult: [],
  })

export const fetchShapeForTrip = (tripId: TripId): Promise<Shape | null> =>
  apiCall({
    url: `/api/shapes/trip/${tripId}`,
    parser: (shape: Shape | null) => shape,
    defaultResult: null,
  })

export const fetchShuttleRoutes = (): Promise<Route[]> =>
  apiCall({
    url: "/api/shuttles",
    parser: parseRoutesData,
    defaultResult: [],
  })

export const fetchTimepointsForRoute = (
  routeId: RouteId
): Promise<Timepoint[]> =>
  apiCall({
    url: `/api/routes/${routeId}`,
    parser: (timepoints: Timepoint[]) => timepoints,
    defaultResult: [],
  })
