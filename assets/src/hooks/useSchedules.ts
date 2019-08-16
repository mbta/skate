import { useEffect, useReducer } from "react"
import { fetchTrips } from "../api"
import { ByRouteId, RouteId, Timestamp, Trip, TripsById } from "../schedule.d"

export const SECONDS_AHEAD_TO_FETCH = 7200
export const SECONDS_AHEAD_TO_REFETCH = 3600
export const SECONDS_BEHIND_TO_FETCH = 1800

interface State {
  lastRequestedTime: ByRouteId<Timestamp>
  lastLoadedTime: ByRouteId<Timestamp>
  tripsById: TripsById
}

const initialState: State = {
  lastRequestedTime: {},
  lastLoadedTime: {},
  tripsById: {},
}

interface SetRequestedTime {
  type: "SET_REQUESTED_TIME"
  payload: {
    routeId: RouteId
    requestedTime: Timestamp
  }
}

const setRequestedTime = (
  routeId: RouteId,
  requestedTime: Timestamp
): SetRequestedTime => ({
  type: "SET_REQUESTED_TIME",
  payload: { routeId, requestedTime },
})

interface SetTrips {
  type: "SET_TRIPS"
  payload: {
    routeId: RouteId
    trips: Trip[]
    requestedTime: Timestamp
  }
}

const setTrips = (
  routeId: RouteId,
  trips: Trip[],
  requestedTime: Timestamp
): SetTrips => ({
  type: "SET_TRIPS",
  payload: { routeId, trips, requestedTime },
})

type Action = SetRequestedTime | SetTrips

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_REQUESTED_TIME":
      return {
        ...state,
        lastRequestedTime: {
          ...state.lastRequestedTime,
          [action.payload.routeId]: action.payload.requestedTime,
        },
      }
    case "SET_TRIPS":
      const {
        [action.payload.routeId]: _removedRequestedTime,
        ...lastRequestedTimeWithoutRouteId
      } = state.lastRequestedTime
      return {
        lastRequestedTime: lastRequestedTimeWithoutRouteId,
        lastLoadedTime: {
          ...state.lastLoadedTime,
          [action.payload.routeId]: action.payload.requestedTime,
        },
        tripsById: addTrips(state.tripsById, action.payload.trips),
      }
    default:
      return state
  }
}

const addTrips = (tripsById: TripsById, trips: Trip[]): TripsById => {
  const tripsByIdCopy = Object.assign({}, tripsById)
  trips.forEach((trip: Trip) => {
    tripsByIdCopy[trip.id] = trip
  })
  return tripsByIdCopy
}

interface FetchRange {
  start: Timestamp
  end: Timestamp
}

const fetchRangeForRoute = (
  lastLoaded: Timestamp | undefined,
  lastRequested: Timestamp | undefined,
  now: Timestamp
): FetchRange | null => {
  if (lastRequested) {
    // already loading
    return null
  } else if (lastLoaded) {
    // have some data already
    if (lastLoaded < now + SECONDS_AHEAD_TO_REFETCH) {
      // the data is old, fetch new data
      return {
        start: lastLoaded,
        end: now + SECONDS_AHEAD_TO_FETCH,
      }
    } else {
      // up to date. do nothing
      return null
    }
  } else {
    // new route
    return {
      start: now - SECONDS_BEHIND_TO_FETCH,
      end: now + SECONDS_AHEAD_TO_FETCH,
    }
  }
}

const allFetchesToDo = (
  lastRequestedTime: ByRouteId<Timestamp>,
  lastLoadedTime: ByRouteId<Timestamp>,
  selectedRouteIds: RouteId[],
  now: Timestamp
): ByRouteId<FetchRange> => {
  const result: ByRouteId<FetchRange> = {}
  selectedRouteIds.forEach((routeId: RouteId) => {
    const fetchRange: FetchRange | null = fetchRangeForRoute(
      lastLoadedTime[routeId],
      lastRequestedTime[routeId],
      now
    )
    if (fetchRange) {
      result[routeId] = fetchRange
    }
  })
  return result
}

const useSchedules = (selectedRouteIds: RouteId[]): TripsById => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const now: Timestamp = Math.floor(Date.now() / 1000)
    const allFetches: ByRouteId<FetchRange> = allFetchesToDo(
      state.lastRequestedTime,
      state.lastLoadedTime,
      selectedRouteIds,
      now
    )
    Object.entries(allFetches).forEach(([routeId, fetchRange]) => {
      dispatch(setRequestedTime(routeId, fetchRange.end))
      fetchTrips(routeId, fetchRange.start, fetchRange.end).then(
        (trips: Trip[]) => {
          dispatch(setTrips(routeId, trips, fetchRange.end))
        }
      )
    })
  })

  return state.tripsById
}

export default useSchedules
