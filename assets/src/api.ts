import "whatwg-fetch"
import { DirectionName, Route, RouteId, TimepointId } from "./schedule.d"

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

interface TimepointsForRouteResponse {
  data: TimepointId[]
}

const checkResponseStatus = (response: Response) => {
  if (response.status !== 200) {
    throw new Error(`Response error: ${response.status}`)
  }
  return response
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
