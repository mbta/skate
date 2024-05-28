import { useCallback, useMemo } from "react"
import { ShapePoint } from "../schedule"
import { fetchDetourDirections, fetchFinishedDetour } from "../api"
import { OriginalRoute } from "../models/detour"

import { useApiCall } from "./useApiCall"
import { Ok, isErr, isOk } from "../util/result"
import { useNearestIntersection } from "./useNearestIntersection"
import { useMachine } from "@xstate/react"
import { createDetourMachine } from "../models/createDetourMachine"

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

export const useDetour = ({ routePatternId, shape }: OriginalRoute) => {
  const [snapshot, send] = useMachine(createDetourMachine)
  const startPoint = snapshot.context.startPoint
  const endPoint = snapshot.context.endPoint
  /** The detour waypoints in-between the start and end point */
  const waypoints = snapshot.context.waypoints
  const allPoints = useMemo(() => {
    if (startPoint === null) {
      return []
    } else if (endPoint === null) {
      return [startPoint].concat(waypoints)
    } else {
      return [startPoint].concat(waypoints).concat([endPoint])
    }
  }, [startPoint, waypoints, endPoint])

  const { result: finishedDetour } = useApiCall({
    apiCall: useCallback(async () => {
      /* Until we have "typegen" in XState,
       * we need to validate these exist for typescript
       *
       * > [Warning] XState Typegen does not fully support XState v5 yet. However,
       * > strongly-typed machines can still be achieved without Typegen.
       * > -- https://stately.ai/docs/migration#use-typestypegen-instead-of-tstypes
       */
      if (startPoint && endPoint) {
        return fetchFinishedDetour(routePatternId, startPoint, endPoint)
      }

      return null
    }, [startPoint, endPoint, routePatternId]),
  })

  const { result: nearestIntersection } = useNearestIntersection({
    latitude: startPoint?.lat,
    longitude: startPoint?.lon,
  })

  const detourShape = useDetourDirections(allPoints)

  const coordinates =
    detourShape.result && isOk(detourShape.result)
      ? detourShape.result.ok.coordinates
      : []

  let directions =
    detourShape.result && isOk(detourShape.result)
      ? detourShape.result.ok.directions
      : undefined
  // Only append direction "Regular Route" after detour is finished
  if (!detourShape.isLoading && directions && finishedDetour) {
    directions = directions.concat({
      instruction: "Regular Route",
    })
  }

  const canAddWaypoint = () =>
    snapshot.can({
      type: "detour.edit.place-waypoint",
      location: { lat: 0, lon: 0 },
    })

  const addWaypoint = canAddWaypoint()
    ? (location: ShapePoint) => {
        send({ type: "detour.edit.place-waypoint", location })
      }
    : undefined

  const addConnectionPoint = (point: ShapePoint) =>
    send({
      type: "detour.edit.place-connection-point",
      location: point,
    })

  const canUndo = snapshot.can({ type: "detour.edit.undo" })

  const undo = () => {
    send({ type: "detour.edit.undo" })
  }

  const clear = () => {
    send({ type: "detour.edit.clear-detour" })
  }

  const finishDetour = () => {
    send({ type: "detour.edit.done" })
  }

  const editDetour = () => {
    send({ type: "detour.edit.resume" })
  }

  const missedStops = finishedDetour?.missedStops || undefined

  const missedStopIds = missedStops
    ? new Set(missedStops.map((stop) => stop.id))
    : new Set()
  const stops = (shape.stops || []).map((stop) => ({
    ...stop,
    missed: missedStopIds.has(stop.id),
  }))

  return {
    /** The current state of the detour machine */
    state: snapshot.matches({ "Detour Drawing": "Editing" })
      ? DetourState.Edit
      : DetourState.Finished,

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
    detourShape: coordinates,
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
    routeSegments: finishedDetour?.routeSegments,
    /**
     * Connection Points
     */
    connectionPoints: finishedDetour?.connectionPoint,

    /**
     * Reports if {@link undo} will do anything.
     */
    canUndo,
    /**
     * Removes the last waypoint in {@link waypoints} if {@link canUndo} is `true`.
     */
    undo,
    /**
     * Clears the entire detour
     */
    clear,

    /** When present, puts this detour in "finished mode" */
    finishDetour: snapshot.can({ type: "detour.edit.done" })
      ? finishDetour
      : undefined,
    /** When present, puts this detour in "edit mode" */
    editDetour,
  }
}
