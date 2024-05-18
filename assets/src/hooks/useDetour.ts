import { useCallback } from "react"
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

  /*
   * There's probably a better way to do this? Tags or maybe context?
   * Tags seem more appropriate, but weird to manage Out-Of-Bounds state via tags.
   * Maybe this entire API call could be moved to and managed by an actor
   * combined with parallel child states within the state machine?
   * -- https://stately.ai/docs/promise-actors */
  const isFinishedDrawing = snapshot.matches({
    "Detour Drawing": { Editing: "Finished Drawing" },
  })
  const isSharingDetour = snapshot.matches({ "Detour Drawing": "Share Detour" })
  const isInFinishedDetourState = isFinishedDrawing || isSharingDetour

  const firstWaypoint = snapshot.context.waypoints.at(0)
  const lastWaypoint = snapshot.context.waypoints.at(-1)
  // Lets also just assert that we're not operating on the same array element
  const has2Waypoints = snapshot.context.waypoints.length >= 2

  const { result: finishedDetour } = useApiCall({
    apiCall: useCallback(async () => {
      if (!isInFinishedDetourState) {
        return null
      }

      /* Until we have "typegen" in XState,
       * we need to validate these exist for typescript
       *
       * > [Warning] XState Typegen does not fully support XState v5 yet. However,
       * > strongly-typed machines can still be achieved without Typegen.
       * > -- https://stately.ai/docs/migration#use-typestypegen-instead-of-tstypes
       */
      if (
        !has2Waypoints ||
        firstWaypoint === undefined ||
        lastWaypoint === undefined
      ) {
        return null
      }

      return fetchFinishedDetour(routePatternId, firstWaypoint, lastWaypoint)
    }, [
      isInFinishedDetourState,
      firstWaypoint,
      lastWaypoint,
      has2Waypoints,
      routePatternId,
    ]),
  })

  const { result: nearestIntersection } = useNearestIntersection({
    latitude: snapshot.context.waypoints.at(0)?.lat,
    longitude: snapshot.context.waypoints.at(0)?.lon,
  })

  const detourShape = useDetourDirections(snapshot.context.waypoints)

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
    startPoint: snapshot.context.waypoints.at(0),
    /**
     * The ending connection point of the detour.
     */
    endPoint:
      (snapshot.matches({
        "Detour Drawing": { Editing: "Finished Drawing" },
      }) &&
        snapshot.context.waypoints.at(-1)) ||
      undefined,
    /**
     * The waypoints that connect {@link startPoint} and {@link endPoint}.
     */
    waypoints: snapshot.matches({
      "Detour Drawing": { Editing: "Finished Drawing" },
    })
      ? snapshot.context.waypoints.slice(1, -1)
      : snapshot.matches({ "Detour Drawing": { Editing: "Place Waypoint" } })
      ? snapshot.context.waypoints.slice(1)
      : [],

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
