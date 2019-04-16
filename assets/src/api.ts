import { Route, RouteId, Timepoint, TimepointId } from "./skate.d"

interface RoutesResponse {
  data: Route[]
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
): Promise<Timepoint[]> =>
  fetch(`/api/routes/${routeId}`)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: timepointIds }: TimepointsForRouteResponse) =>
      timepointIds.map(timepointId => ({ id: timepointId }))
    )
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })
