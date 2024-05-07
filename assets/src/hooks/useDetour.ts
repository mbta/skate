// import { useCallback, useEffect, useMemo, useState } from "react"
import { ShapePoint, Stop } from "../schedule"
// import { fetchDetourDirections, fetchFinishedDetour } from "../api"
// import { DetourShape, FinishedDetour, OriginalRoute } from "../models/detour"

import { DetourShape, FinishedDetour, OriginalRoute } from "../models/detour"
import { fetchDetourDirections, fetchFinishedDetour } from "../api"
import { useCallback, useEffect, useMemo, useState } from "react"

// import { useApiCall } from "./useApiCall"
import {
  Ok,
  isErr, // isErr, isOk
} from "../util/result"
import { useNearestIntersection } from "./useNearestIntersection"

import { useApiCall } from "./useApiCall"

const useDetourDirections = (shapePoints: ShapePoint[]) =>
  useApiCall({
    apiCall: useCallback(async () => {
      // We expect not to have any directions or shape if we don't have at
      // least two points to route between
      if (shapePoints.length < 2) {
        return Ok({ coordinates: [], directions: undefined })
      }

      return fetchDetourDirections(shapePoints)
    }, [shapePoints]),
  })

export enum DetourState {
  Edit,
  Finished,
}

export const useDetour = ({ shape, routePatternId }: OriginalRoute) => {
  const [state, setState] = useState<DetourState>(DetourState.Edit)
  const [startPoint, setStartPoint] = useState<ShapePoint | null>(null)
  const [endPoint, setEndPoint] = useState<ShapePoint | null>(null)
  const [waypoints, setWaypoints] = useState<ShapePoint[]>([])
  const [finishedDetour, setFinishedDetour] = useState<FinishedDetour | null>(
    null
  )

  useEffect(() => {
    let shouldUpdate = true
    if (startPoint && endPoint) {
      fetchFinishedDetour(routePatternId, startPoint, endPoint).then(
        (result) => {
          if (shouldUpdate) {
            setFinishedDetour(result)
          }
        }
      )
    } else {
      setFinishedDetour(null)
    }
    return () => {
      shouldUpdate = false
    }
  }, [routePatternId, startPoint, endPoint])

  const { result: nearestIntersection } = useNearestIntersection({
    latitude: startPoint?.lat,
    longitude: startPoint?.lon,
  })

  const detourShape = useDetourDirections(
    useMemo(
      () =>
        [startPoint, ...waypoints, endPoint].filter(
          (v): v is ShapePoint => !!v
        ),
      [startPoint, waypoints, endPoint]
    ) ?? []
  )

  // const coordinates =
  //   detourShape.result && isOk(detourShape.result)
  //     ? detourShape.result.ok.coordinates
  //     : []
  let directions: DetourShape["directions"] = []
  // let directions =
  //   detourShape.result && isOk(detourShape.result)
  //     ? detourShape.result.ok.directions
  //     : undefined
  // // Only append direction "Regular Route" after detour is finished
  // if (!detourShape.isLoading && directions && finishedDetour) {
  if (finishedDetour) {
    directions = directions.concat({
      instruction: "Regular Route",
    })
  }
  // const canAddWaypoint = () => startPoint !== null && endPoint === null

  const addWaypoint = (p: ShapePoint) => {
    setWaypoints((positions) => [...positions, p])
  }

  // const addWaypoint = canAddWaypoint()
  //   ? (p: ShapePoint) => {
  //       setWaypoints((positions) => [...positions, p])
  //     }
  //   : undefined
  const addConnectionPoint = (point: ShapePoint) => {
    if (startPoint === null) {
      setStartPoint(point)
    } else if (endPoint === null) {
      setEndPoint(point)
    }
  }
  const canUndo = startPoint !== null // && state === DetourState.Edit
  const undo = () => {
    // if (!canUndo) return
    if (endPoint !== null) {
      setEndPoint(null)
    } else if (waypoints.length > 0) {
      setWaypoints((positions) => positions.slice(0, positions.length - 1))
    } else if (startPoint !== null) {
      setStartPoint(null)
    }
  }
  const clear = () => {
    setEndPoint(null)
    setStartPoint(null)
    setWaypoints([])
  }

  const finishDetour = () => {
    setState(DetourState.Finished)
  }

  const editDetour = () => {
    //   setState(DetourState.Edit)
  }
  const missedStops = finishedDetour?.missedStops || []
  const missedStopIds = missedStops
    ? new Set(missedStops.map((stop) => stop.id))
    : new Set()
  const stops = (shape.stops || []).map((stop) => ({
    ...stop,
    missed: missedStopIds.has(stop.id),
  }))

  return {
    /** The current state of the detour machine */
    state,

    /** Creates a new waypoint if all of the following criteria is met:
     * - {@link startPoint} is set
     * - {@link endPoint} is not set.
     */
    addWaypoint,

    /**
     * Sets {@link startPoint} if unset.
     * Otherwise sets {@link endPoint} if unset.
     */
    addConnectionPoint,
    //     state === DetourState.Finished ? undefined : addConnectionPoint,

    /**
     * The starting connection point of the detour.
     */
    startPoint,

    /**
     * The ending connection point of the detour.
     */
    endPoint,

    /**
     * The waypoints that connect {@link startPoint} and {@link endPoint}.
     */
    waypoints,

    /**
     * The routing API generated detour shape.
     */
    detourShape: [] as ShapePoint[],
    //   detourShape: coordinates,

    /**
     * The turn-by-turn directions generated by the routing API.
     */
    directions,

    /**
     * The nearest intersection to the detour start.
     */
    nearestIntersection,

    /**
     * Indicates if there was an error fetching directions from ORS
     */
    routingError:
      detourShape.result && isErr(detourShape.result)
        ? detourShape.result.err
        : undefined,

    /**
     * Stops that are not missed by the detour (starts out as all of the stops)
     */
    stops,

    /**
     * Stops missed by the detour, determined after the route is completed
     */
    missedStops,

    /**
     * Three partial route-shape segments: before, during, and after the detour
     */
    routeSegments: undefined,
    // routeSegments: finishedDetour?.routeSegments,

    /**
     * Connection Points
     */
    connectionPoints: undefined as undefined | { start?: Stop; end?: Stop },
    // connectionPoints: finishedDetour?.connectionPoint,

    /**
     * Reports if {@link undo} will do anything.
     */
    canUndo,

    /**
     * Removes the last waypoint in {@link waypoints} if {@link canUndo} is `true`.
     */
    undo,
    //   undo: state === DetourState.Finished ? undefined : undo,

    /**
     * Clears the entire detour
     */
    clear,
    //   clear: state === DetourState.Finished ? undefined : clear,

    /** When present, puts this detour in "finished mode" */
    finishDetour: endPoint !== null ? finishDetour : undefined,

    /** When present, puts this detour in "edit mode" */
    editDetour,
    // editDetour: state === DetourState.Finished ? editDetour : undefined,
  }
}
