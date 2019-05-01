import { Route, RouteId, TimepointId } from "./skate.d"

interface RoutesResponse {
  data: Route[]
}

interface TimepointsResponse {
  data: TimepointId[]
}

const checkResponseStatus = (response: Response) => {
  if (response.status !== 200) {
    throw new Error(`Response error: ${response.status}`)
  }
  return response
}

const parseJson = (response: Response) => response.json()

export const fetchRoutes = (): Promise<Route[]> =>
  fetch("/api/routes")
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: routes }: RoutesResponse) => routes)
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })

export const fetchTimepointsForRoute = (
  routeId: RouteId
): Promise<TimepointId[]> =>
  fetch(`/api/routes/${routeId}`)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: timepointIds }: TimepointsResponse) => timepointIds)
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })
