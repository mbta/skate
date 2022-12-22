import "whatwg-fetch"
import appData from "./appData"
import { Block, Run } from "./minischedule"
import { reload } from "./models/browser"
import { blockFromData, runFromData } from "./models/minischeduleData"
import { SwingData, swingsFromData } from "./models/swingsData"
import { NotificationId, NotificationState, RunId } from "./realtime.d"
import {
  DirectionName,
  GarageName,
  Route,
  RouteId,
  Shape,
  Stop,
  Swing,
  Timepoint,
  TripId,
} from "./schedule.d"
import { RouteTab } from "./models/routeTab"
import { array, assert, Struct } from "superstruct"
import { ShapeData, shapeFromData, shapesFromData } from "./models/shapeData"

export interface RouteData {
  id: string
  direction_names: {
    "0": DirectionName
    "1": DirectionName
  }
  name: string
  garages: GarageName[]
}

const checkResponseStatus = (response: Response) => {
  if (response.status === 200) {
    return response
  }

  if (Math.floor(response.status / 100) === 3 || response.status === 403) {
    // If the API sends us a redirect or forbidden, the user needs to
    // re-authenticate. Reload to go through the auth flow again.
    reload()
  }

  throw new Error(`Response error: ${response.status}`)
}

const parseJson = (response: Response) => response.json() as unknown

export const apiCall = <T>({
  url,
  parser,
  defaultResult,
  fetchArgs,
}: {
  url: string
  parser: (data: any) => T
  defaultResult?: T
  fetchArgs?: RequestInit
}): Promise<T> =>
  fetch(url, fetchArgs)
    .then(checkResponseStatus)
    .then((response) => parseJson(response) as any)
    .then(({ data: data }: { data: any }) => parser(data))
    .catch((error) => {
      if (defaultResult === undefined) {
        throw error
      } else {
        return defaultResult
      }
    })

export const checkedApiCall = <T, U>({
  url,
  dataStruct,
  parser,
  defaultResult,
  fetchArgs,
}: {
  url: string
  dataStruct: Struct<T, any>
  parser: (data: T) => U
  defaultResult?: U
  fetchArgs?: RequestInit
}): Promise<U> =>
  fetch(url, fetchArgs)
    .then(checkResponseStatus)
    .then((response) => parseJson(response) as { data: unknown })
    .then(({ data: data }) => {
      assert(data, dataStruct)
      return parser(data)
    })
    .catch((error) => {
      if (defaultResult !== undefined) {
        return defaultResult
      } else {
        throw error
      }
    })

export const parseRouteData = ({
  id,
  direction_names,
  name,
  garages,
}: RouteData): Route => ({
  id,
  directionNames: direction_names,
  name,
  garages,
})

const parseRoutesData = (routesData: RouteData[]): Route[] =>
  routesData.map(parseRouteData)

export const fetchRoutes = (): Promise<Route[]> =>
  apiCall({
    url: "/api/routes",
    parser: parseRoutesData,
  })

export const fetchShapeForRoute = (routeId: RouteId): Promise<Shape[]> =>
  checkedApiCall({
    url: `/api/shapes/route/${routeId}`,
    parser: shapesFromData,
    dataStruct: array(ShapeData),
    defaultResult: [],
  })

export const fetchShapeForTrip = (tripId: TripId): Promise<Shape | null> =>
  checkedApiCall({
    url: `/api/shapes/trip/${tripId}`,
    parser: shapeFromData,
    dataStruct: ShapeData,
    defaultResult: null,
  })

export const fetchShuttleRoutes = (): Promise<Route[]> =>
  apiCall({
    url: "/api/shuttles",
    parser: parseRoutesData,
    defaultResult: [],
  })

export const fetchStations = (): Promise<Stop[] | null> =>
  apiCall({
    url: `/api/stops/stations`,
    parser: (stations: Stop[] | null) => stations,
    defaultResult: null,
  })

export const fetchTimepointsForRoute = (
  routeId: RouteId
): Promise<Timepoint[]> =>
  apiCall({
    url: `/api/routes/${routeId}`,
    parser: (timepoints: Timepoint[]) => timepoints,
    defaultResult: [],
  })

export const fetchScheduleRun = (
  tripId: TripId,
  runId: RunId | null
): Promise<Run | null> => {
  if (runId) {
    return apiCall({
      url: `/api/schedule/run?trip_id=${tripId}&run_id=${runId}`,
      parser: nullableParser(runFromData),
      defaultResult: null,
    })
  } else {
    return apiCall({
      url: `/api/schedule/run?trip_id=${tripId}`,
      parser: nullableParser(runFromData),
      defaultResult: null,
    })
  }
}

export const fetchScheduleBlock = (tripId: TripId): Promise<Block | null> =>
  apiCall({
    url: `/api/schedule/block?trip_id=${tripId}`,
    parser: nullableParser(blockFromData),
    defaultResult: null,
  })

export const fetchNearestIntersection = (
  latitude: number,
  longitude: number
): Promise<string | null> =>
  apiCall({
    url: `/api/intersection?latitude=${latitude}&longitude=${longitude}`,
    parser: nullableParser((intersection: string) => intersection),
    defaultResult: null,
  })

export const fetchSwings = (routeIds: RouteId[]): Promise<Swing[] | null> =>
  checkedApiCall<SwingData[], Swing[] | null>({
    url: `/api/swings?route_ids=${routeIds.join(",")}`,
    dataStruct: array(SwingData),
    parser: nullableParser(swingsFromData),
  })

export const putNotificationReadState = (
  newReadState: NotificationState,
  notificationIds: NotificationId[]
): void => {
  const url = `/api/notification_read_state?new_state=${newReadState}&notification_ids=${notificationIds.join(
    ","
  )}`
  fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": getCsrfToken(),
    },
  })
}

export const putUserSetting = (field: string, value: string): void => {
  const url = `/api/user_settings?field=${field}&value=${value}`
  fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": getCsrfToken(),
    },
  })
}

export const putRouteTabs = (routeTabs: RouteTab[]): Promise<Response> =>
  fetch("/api/route_tabs", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": getCsrfToken(),
    },
    body: JSON.stringify({ route_tabs: routeTabs }),
  })

const getCsrfToken = (): string => appData()?.csrfToken || ""

export const nullableParser =
  <Data, T>(parser: (data: Data) => T): ((data: Data | null) => T | null) =>
  (data: Data | null) =>
    data === null ? null : parser(data)
