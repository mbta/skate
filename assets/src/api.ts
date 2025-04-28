import "whatwg-fetch"
import appData from "./appData"
import { ScheduleBlock, ScheduleRun } from "./minischedule"
import { reload } from "./models/browser"
import {
  scheduleBlockFromData,
  scheduleRunFromData,
} from "./models/minischeduleData"
import { SwingData, swingsFromData } from "./models/swingsData"
import { NotificationId, NotificationState, RunId } from "./realtime"
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
import {
  any,
  array,
  assert,
  boolean,
  create,
  enums,
  Infer,
  is,
  never,
  number,
  object,
  Struct,
  StructError,
} from "superstruct"
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
import {
  GroupedDetoursData,
  groupedDetoursFromData,
  GroupedSimpleDetours,
} from "./models/detoursList"
import {
  DetourShape,
  detourStateFromData,
  DetourWithState,
  DetourWithStateData,
  FinishedDetour,
  UnfinishedDetour,
} from "./models/detour"
import {
  FinishedDetourData,
  finishedDetourFromData,
} from "./models/finishedDetour"
import { FetchResult, ok, fetchError } from "./util/fetchResult"
import { Ok, Err, Result, map } from "./util/result"
import {
  UnfinishedDetourData,
  unfinishedDetourFromData,
} from "./models/unfinishedDetour"
import { Snapshot } from "xstate"

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

/**
 * @deprecated use {@linkcode apiCallResult}
 *
 * A small wrapper around fetch which checks for valid responses and parses
 * JSON from the result body. It processes the resulting object with
 * {@linkcode parser}
 *
 * If there is _any_ error, returns {@linkcode defaultResult}.
 */
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

/**
 * @deprecated use {@linkcode apiCallResult}
 *
 * A slightly larger (than {@linkcode apiCall}) wrapper around
 * {@linkcode fetch} which checks for valid responses and then parses JSON from
 * the body, and asserts it's validity with `superstruct`.
 *
 * It then transforms the input with {@linkcode parser}
 *
 * If there are any errors, returns {@linkcode defaultResult}
 */
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

/**
 * @deprecated use {@linkcode apiCallResult}
 *
 * A wrapper around {@linkcode fetch} which returns a {@linkcode FetchResult}.
 *
 * This does mainly the same thing as {@linkcode checkedApiCall} but returns
 * errors and successes separately using {@linkcode FetchResult}.
 */
export const apiCallWithError = <T, U>({
  url,
  dataStruct,
  parser,
  fetchArgs,
}: {
  url: string
  dataStruct: Struct<T, any>
  parser: (data: T) => U
  fetchArgs?: RequestInit
}): Promise<FetchResult<U>> =>
  fetch(url, fetchArgs)
    .then(checkResponseStatus)
    .then((response) => parseJson(response) as { data: unknown })
    .then(({ data: data }) => {
      assert(data, dataStruct)
      return ok(parser(data))
    })
    .catch((error) => {
      if (error instanceof StructError) {
        Sentry.captureException(error)
      }

      return fetchError()
    })

/**
 * A wrapper around {@linkcode fetch} which returns a {@linkcode Result}.
 *
 * This function returns a {@linkcode Result} so that it's easy to differentiate
 * between different error states.
 *
 * For example, previous implementations,
 * e.g. {@linkcode checkedApiCall} and {@linkcode apiCall}, provided a
 * `defaultResult` parameter which was returned if there was _any_ issue;
 * If a successful {@linkcode fetch} to an endpoint _also_ returned the same
 * value as `defaultResult`, say `null`, then there isn't a way to tell if the
 * `null` was because of an error or because of a successful request.
 * This _also_ happened if there was an unrelated error when fetching, so there
 * was not an easy way to tell the difference between an errored endpoint or an
 * errored fetch call.
 *
 * Diverging from {@linkcode apiCall}, this does not handle errors such as
 * network issues and deals only with json response bodies. That is left up to
 * the caller to add a `.catch` handler to the returned {@linkcode Promise},
 * because there may not be a generic way that those kind of errors should be
 * handled. (This API could be opinionated or extended to return something like
 * `Promise<Result<Result<T, E>, FetchError>>`, but instead that is left up to
 * callers to implement instead of assuming any requirements.
 */
export const apiCallResult = async <T, E>({
  url,
  OkStruct,
  ErrStruct,
  parser,
  requestInit,
}: {
  url: Parameters<typeof fetch>[0]
  OkStruct: Struct<T, unknown>
  ErrStruct: Struct<E, unknown>
  parser?: (data: any) => T
  requestInit?: Parameters<typeof fetch>[1]
}): Promise<Result<T, E>> =>
  fetch(url, requestInit)
    .then(async (response) => {
      // If the fetch does not error and returns something from the endpoint,
      // parse as json.
      const json: unknown = await response.json()

      // Then check if the response is `ok` and try to return `Ok(OkStruct)`
      // Otherwise, return `Err(ErrStruct)` and attempt to return the data
      // according to JSONAPI specifications
      if (response.ok && is(json, object({ data: any() }))) {
        const parsed = parser ? parser(json.data) : json.data
        return Ok(create(parsed, OkStruct))
      } else {
        assert(json, object({ error: any() }))
        return Err(create(json.error, ErrStruct))
      }
    })
    .catch((error) => {
      if (error instanceof StructError) {
        Sentry.captureException(error)
      }
      // We throw within the returned promise because downstream consumers
      // should handle errors themselves
      throw error
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

const postJsonParameter = (content: unknown): Parameters<typeof fetch>[1] => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-csrf-token": getCsrfToken(),
  },
  body: JSON.stringify(content),
})

const FetchDetourDirectionsError = object({
  type: enums(["unknown", "no_route"]),
})

export type FetchDetourDirectionsError = Infer<
  typeof FetchDetourDirectionsError
>

export const fetchDetourDirections = (
  coordinates: ShapePoint[]
): Promise<Result<DetourShape, FetchDetourDirectionsError>> =>
  apiCallResult({
    url: "/api/detours/directions",
    OkStruct: DetourShapeData,
    ErrStruct: FetchDetourDirectionsError,
    requestInit: postJsonParameter({
      coordinates,
    }),
  }).then((v) => map(v, detourShapeFromData))

export const fetchUnfinishedDetour = (
  routePatternId: RoutePatternId,
  connectionStart: ShapePoint
): Promise<UnfinishedDetour | null> =>
  checkedApiCall<UnfinishedDetourData, UnfinishedDetour | null>({
    url: "/api/detours/unfinished_detour",
    parser: unfinishedDetourFromData,
    dataStruct: UnfinishedDetourData,
    defaultResult: null,
    fetchArgs: postJsonParameter({
      route_pattern_id: routePatternId,
      connection_start: connectionStart,
    }),
  })

export const fetchFinishedDetour = (
  routePatternId: RoutePatternId,
  connectionStart: ShapePoint,
  waypoints: ShapePoint[],
  connectionEnd: ShapePoint
): Promise<FinishedDetour | null> =>
  checkedApiCall<FinishedDetourData, FinishedDetour | null>({
    url: "/api/detours/finished_detour",
    parser: finishedDetourFromData,
    dataStruct: FinishedDetourData,
    defaultResult: null,
    fetchArgs: postJsonParameter({
      route_pattern_id: routePatternId,
      connection_start: connectionStart,
      waypoints: waypoints,
      connection_end: connectionEnd,
    }),
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
): Promise<ScheduleRun | null> => {
  if (runId) {
    return apiCall({
      url: `/api/schedule/run?trip_id=${tripId}&run_id=${runId}`,
      parser: nullableParser(scheduleRunFromData),
      defaultResult: null,
    })
  } else {
    return apiCall({
      url: `/api/schedule/run?trip_id=${tripId}`,
      parser: nullableParser(scheduleRunFromData),
      defaultResult: null,
    })
  }
}

export const fetchScheduleBlock = (
  tripId: TripId
): Promise<ScheduleBlock | null> =>
  apiCall({
    url: `/api/schedule/block?trip_id=${tripId}`,
    parser: nullableParser(scheduleBlockFromData),
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

// #region Detour API functions

export const putDetourUpdate = (
  snapshot: Snapshot<unknown>
): Promise<Result<number, never>> =>
  apiCallResult({
    url: `/api/detours/update_snapshot`,
    OkStruct: number(),
    ErrStruct: never(),
    requestInit: {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
      body: JSON.stringify({ snapshot: snapshot }),
    },
  })

export const fetchDetours = (): Promise<Result<GroupedSimpleDetours, never>> =>
  apiCallResult({
    url: `/api/detours`,
    OkStruct: GroupedDetoursData,
    ErrStruct: never(),
  }).then((v) => map(v, groupedDetoursFromData))

export const fetchDetour = (
  id: number
): Promise<Result<DetourWithState, never>> =>
  apiCallResult({
    url: `/api/detours/${id}`,
    OkStruct: DetourWithStateData,
    ErrStruct: never(),
  }).then((v) => map(v, detourStateFromData))

export const deleteDetour = (id: number): Promise<Result<boolean, never>> => {
  return apiCallResult({
    url: `/api/detours/${id}`,
    OkStruct: boolean(),
    ErrStruct: never(),
    requestInit: {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
    },
  })
}

// #endregion Detour API functions

const getCsrfToken = (): string => appData()?.csrfToken || ""

export const nullableParser =
  <Data, T>(parser: (data: Data) => T): ((data: Data | null) => T | null) =>
  (data: Data | null) =>
    data === null ? null : parser(data)
