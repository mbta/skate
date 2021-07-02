import "whatwg-fetch"
import appData from "./appData"
import { Block, Run } from "./minischedule"
import { reload } from "./models/browser"
import { blockFromData, runFromData } from "./models/minischeduleData"
import { swingsFromData } from "./models/swingsData"
import { NotificationId, NotificationState } from "./realtime.d"
import { RouteSettings } from "./routeSettings"
import {
  DirectionName,
  Route,
  RouteId,
  Shape,
  Swing,
  Timepoint,
  TripId,
} from "./schedule.d"

export interface RouteData {
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
    .catch((error) => {
      if (defaultResult === undefined) {
        throw error
      } else {
        return defaultResult
      }
    })

export const parseRouteData = ({
  id,
  direction_names,
  name,
}: RouteData): Route => ({
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

export const fetchMinischeduleRun = (tripId: TripId): Promise<Run | null> =>
  apiCall({
    url: `/api/minischedule/run/${tripId}`,
    parser: nullableParser(runFromData),
    defaultResult: null,
  })

export const fetchMinischeduleBlock = (tripId: TripId): Promise<Block | null> =>
  apiCall({
    url: `/api/minischedule/block/${tripId}`,
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

export const fetchSwings = (): Promise<Swing[] | null> =>
  apiCall({
    url: "/api/swings",
    parser: nullableParser(swingsFromData),
    defaultResult: null,
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

export const putRouteSettings = (routeSettings: RouteSettings): void => {
  fetch("/api/route_settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": getCsrfToken(),
    },
    body: JSON.stringify(routeSettings),
  })
}

const getCsrfToken = (): string => appData()?.csrfToken || ""

export const nullableParser =
  <Data, T>(parser: (data: Data) => T): ((data: Data | null) => T | null) =>
  (data: Data | null) =>
    data === null ? null : parser(data)
