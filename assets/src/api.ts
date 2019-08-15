import "whatwg-fetch"
import {
  BlockId,
  DirectionId,
  DirectionName,
  Route,
  RouteId,
  RoutePatternId,
  StopId,
  StopTime,
  TimepointId,
  Timestamp,
  Trip,
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

interface TripData {
  id: TripId
  route_id: RouteId
  headsign: string
  direction_id: DirectionId
  block_id: BlockId
  route_pattern_id: RoutePatternId | null
  stop_times: StopTimeData[]
}

interface StopTimeData {
  stop_id: StopId
  timestamp: Timestamp
  timepoint_id: TimepointId | null
}

const tripFromData = (tripData: TripData): Trip => ({
  id: tripData.id,
  routeId: tripData.route_id,
  headsign: tripData.headsign,
  directionId: tripData.direction_id,
  blockId: tripData.block_id,
  routePatternId: tripData.route_pattern_id,
  stopTimes: tripData.stop_times.map(stopTimeFromData),
})

const stopTimeFromData = (stopTimeData: StopTimeData): StopTime => ({
  stopId: stopTimeData.stop_id,
  timestamp: stopTimeData.timestamp,
  timepointId: stopTimeData.timepoint_id,
})

export const fetchTrips = (
  routeId: RouteId,
  startTime: Timestamp,
  endTime: Timestamp
): Promise<Trip[]> =>
  fetch(`/api/trips/${routeId}?start_time=${startTime}&end_time=${endTime}`)
    .then(checkResponseStatus)
    .then(parseJson)
    .then(({ data: tripsData }: { data: TripData[] }) =>
      tripsData.map(tripFromData)
    )
    .catch(error => {
      // tslint:disable-next-line: no-console
      console.error(error)
      throw error
    })
