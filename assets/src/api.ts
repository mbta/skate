import {
  DirectionName,
  Route,
  RouteId,
  Timepoint,
  TimepointId,
  UserToken,
} from "./skate.d"

interface RoutesResponse {
  data: RouteData[]
}

interface RouteData {
  id: string
  direction_names: {
    "0": DirectionName
    "1": DirectionName
  }
}

interface TimepointsForRouteResponse {
  data: TimepointId[]
}

const request = (url: string, userToken?: UserToken) => {
  const options = userToken ? { headers: { token: userToken } } : {}
  return fetch(url, options)
}

const checkResponseStatus = (response: Response) => {
  if (response.status !== 200) {
    throw new Error(`Response error: ${response.status}`)
  }
  return response
}

const parseJson = (response: Response) => response.json()

const parseRouteData = ({ id, direction_names }: RouteData): Route => ({
  id,
  directionNames: direction_names,
})

const parseRoutesData = (routesData: RouteData[]): Route[] =>
  routesData.map(parseRouteData)

export const fetchRoutes = (userToken?: UserToken): Promise<Route[]> =>
  request("/api/routes", userToken)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: routes }: RoutesResponse) => parseRoutesData(routes))
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })

export const fetchTimepointsForRoute = (
  routeId: RouteId,
  userToken?: UserToken
): Promise<Timepoint[]> =>
  request(`/api/routes/${routeId}`, userToken)
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
