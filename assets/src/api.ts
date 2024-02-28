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
  RoutePattern,
  RoutePatternId,
  Shape,
  ShapePoint,
  Stop,
  Swing,
  Timepoint,
  TripId,
} from "./schedule.d"
import { RouteTab } from "./models/routeTab"
import { array, assert, Struct, StructError } from "superstruct"
import { ShapeData, shapeFromData, shapesFromData } from "./models/shapeData"
import { StopData, stopsFromData } from "./models/stopData"
import {
  RoutePatternData,
  routePatternsFromData,
} from "./models/routePatternData"
import * as Sentry from "@sentry/react"
import { LocationSearchResult } from "./models/locationSearchResult"
import {
  LocationSearchResultData,
  locationSearchResultFromData,
  locationSearchResultsFromData,
} from "./models/locationSearchResultData"
import {
  LocationSearchSuggestionData,
  locationSearchSuggestionsFromData,
} from "./models/locationSearchSuggestionData"
import { LocationSearchSuggestion } from "./models/locationSearchSuggestion"
import { DetourShapeData, detourShapeFromData } from "./models/detourShapeData"
import { DetourShape, FinishedDetour } from "./models/detour"
import {
  FinishedDetourData,
  finishedDetourFromData,
} from "./models/finishedDetour"

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
  defaultResult: T
  fetchArgs?: RequestInit
}): Promise<T> =>
  fetch(url, fetchArgs)
    .then(checkResponseStatus)
    .then((response) => parseJson(response) as any)
    .then(({ data: data }: { data: any }) => parser(data))
    .catch(() => defaultResult)

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
  defaultResult: U
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
      if (error instanceof StructError) {
        Sentry.captureException(error)
      }

      return defaultResult
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
    defaultResult: [],
  })

export const fetchRoutePatterns = (routeId: RouteId): Promise<RoutePattern[]> =>
  checkedApiCall({
    url: `/api/route_patterns/route/${routeId}`,
    parser: routePatternsFromData,
    dataStruct: array(RoutePatternData),
    defaultResult: [],
  })

export const fetchShapeForRoute = (routeId: RouteId): Promise<Shape[]> =>
  checkedApiCall({
    url: `/api/shapes/route/${routeId}`,
    parser: shapesFromData,
    dataStruct: array(ShapeData),
    defaultResult: [],
  })

export const fetchDetourDirections = (
  coordinates: ShapePoint[]
): Promise<DetourShape | null> =>
  checkedApiCall({
    url: "/api/detours/directions",
    parser: detourShapeFromData,
    dataStruct: DetourShapeData,
    defaultResult: null,
    fetchArgs: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
      body: JSON.stringify({ coordinates }),
    },
  })

export const fetchFinishedDetour = (
  routePatternId: RoutePatternId,
  connectionStart: ShapePoint,
  connectionEnd: ShapePoint
): Promise<FinishedDetour | null> =>
  checkedApiCall<FinishedDetourData, FinishedDetour | null>({
    url: "/api/detours/finished_detour",
    parser: finishedDetourFromData,
    dataStruct: FinishedDetourData,
    defaultResult: null,
    fetchArgs: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
      body: JSON.stringify({
        route_pattern_id: routePatternId,
        connection_start: connectionStart,
        connection_end: connectionEnd,
      }),
    },
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

export const fetchStations = (): Promise<Stop[]> =>
  checkedApiCall<StopData[], Stop[]>({
    url: `/api/stops/stations`,
    parser: stopsFromData,
    dataStruct: array(StopData),
    defaultResult: [],
  })

export const fetchAllStops = (): Promise<Stop[]> =>
  checkedApiCall<StopData[], Stop[]>({
    url: `/api/stops`,
    parser: stopsFromData,
    dataStruct: array(StopData),
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
    defaultResult: [],
  })

export const fetchLocationSearchResults = (
  searchText: string
): Promise<LocationSearchResult[] | null> =>
  checkedApiCall<LocationSearchResultData[], LocationSearchResult[] | null>({
    url: `api/location_search/search?query=${encodeURIComponent(searchText)}`,
    dataStruct: array(LocationSearchResultData),
    parser: nullableParser(locationSearchResultsFromData),
    defaultResult: [],
  })

export const fetchLocationSearchResultById = (
  placeId: string
): Promise<LocationSearchResult | null> =>
  checkedApiCall<LocationSearchResultData, LocationSearchResult | null>({
    url: `api/location_search/place/${placeId}`,
    dataStruct: LocationSearchResultData,
    parser: nullableParser(locationSearchResultFromData),
    defaultResult: null,
  })

export const fetchLocationSearchSuggestions = (
  searchText: string
): Promise<LocationSearchSuggestion[] | null> =>
  checkedApiCall<
    LocationSearchSuggestionData[],
    LocationSearchSuggestion[] | null
  >({
    url: `api/location_search/suggest?query=${encodeURIComponent(searchText)}`,
    dataStruct: array(LocationSearchSuggestionData),
    parser: nullableParser(locationSearchSuggestionsFromData),
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
