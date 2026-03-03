import { useCallback } from "react"
import { ShapePoint } from "../schedule"
import { fetchUnfinishedDetour, putDetourUpdate } from "../api"
import { useApiCall } from "./useApiCall"
import { isErr, isOk } from "../util/result"
import { useMachine } from "@xstate/react"
import {
  CreateDetourMachineInput,
  createDetourMachine,
} from "../models/createDetourMachine"
import { Snapshot } from "xstate"
import { useEffect } from "react"

export type UseDetourInput =
  | {
      /** Initial arguments for {@linkcode createDetourMachine} */
      originalRoute: CreateDetourMachineInput
    }
  | {
      /** A _validated_ snapshot from which to initialize {@linkcode createDetourMachine} with */
      snapshot: Snapshot<unknown>
    }

export const useDetour = (useDetourProps: UseDetourInput) => {
  const input =
    "snapshot" in useDetourProps
      ? {
          snapshot: useDetourProps.snapshot,
        }
      : {
          input: useDetourProps.originalRoute,
        }
  const [snapshot, send, actorRef] = useMachine(createDetourMachine, input)

  // Record snapshots when changed
  useEffect(() => {
    const snapshotSubscription = actorRef.subscribe((snap) => {
      const persistedSnapshot = actorRef.getPersistedSnapshot()
      const serializedSnapshot = JSON.stringify(persistedSnapshot)
      localStorage.setItem("snapshot", serializedSnapshot)
      // check for no-save tag before
      if (snap.hasTag("no-save") || !snap.context.nearestIntersection) {
        return
      }

      // if detour already activated, do not save, unless overridden
      if (snap.context.activatedAt && !snap.hasTag("save-activated")) {
        return
      }

      actorRef.getSnapshot().can({ type: "detour.save.begin-save" }) &&
        actorRef.send({ type: "detour.save.begin-save" })

      putDetourUpdate(persistedSnapshot).then((uuid) => {
        if (
          isOk(uuid) &&
          actorRef
            .getSnapshot()
            .can({ type: "detour.save.set-uuid", uuid: uuid.ok })
        ) {
          actorRef.send({ type: "detour.save.set-uuid", uuid: uuid.ok })
        }
      })
    })

    return () => {
      snapshotSubscription.unsubscribe()
    }
  }, [actorRef])

  const {
    routePattern,
    startPoint,
    endPoint,
    waypoints,
    finishedDetour,
    detourShape,
    nearestIntersection,
    selectedDuration,
    selectedReason,
    editedSelectedDuration,
  } = snapshot.context

  const { result: unfinishedDetour } = useApiCall({
    apiCall: useCallback(async () => {
      if (startPoint && routePattern?.id) {
        return fetchUnfinishedDetour(routePattern.id, startPoint)
      } else {
        return null
      }
    }, [startPoint, routePattern]),
  })

  const coordinates =
    detourShape && isOk(detourShape) ? detourShape.ok.coordinates : []

  const directions =
    detourShape && isOk(detourShape) ? detourShape.ok.directions : undefined

  const waypointIndexes =
    detourShape && isOk(detourShape)
      ? detourShape.ok.waypoint_indexes
      : undefined

  // if saved snapshots do not include the new waypoint_indexes prop
  // refetch by reentering the editing state
  // only needed for the first edit on pre 2026-03 draft detours
  useEffect(() => {
    if (detourShape && isOk(detourShape) && !detourShape.ok.waypoint_indexes) {
      send({ type: "detour.edit.reenter" })
    }
  }, [send])

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

  const canInsertWaypoint = () =>
    snapshot.can({
      type: "detour.edit.insert-waypoint",
      location: { lat: 0, lon: 0 },
      index: 0,
    })

  const insertWaypoint = canInsertWaypoint()
    ? (location: ShapePoint, index: number) => {
        send({ type: "detour.edit.insert-waypoint", location, index })
      }
    : undefined

  const deleteWaypointMemo = useCallback(
    (index: number) => send({ type: "detour.edit.delete-waypoint", index }),
    [send]
  )
  const deleteWaypoint = snapshot.can({
    type: "detour.edit.delete-waypoint",
    index: -1,
  })
    ? deleteWaypointMemo
    : undefined

  const moveWaypointMemo = useCallback(
    (index: number, position: ShapePoint) =>
      send({ type: "detour.edit.move-waypoint", index, position }),
    [send]
  )
  const moveWaypoint = snapshot.can({
    type: "detour.edit.move-waypoint",
    index: -1,
    position: { lat: -1, lon: -1 },
  })
    ? moveWaypointMemo
    : undefined

  const addConnectionPoint = (point: ShapePoint) =>
    send({
      type: "detour.edit.place-waypoint-on-route",
      location: point,
    })

  const canUndo = snapshot.can({ type: "detour.edit.undo" })

  const undo = () => {
    send({ type: "detour.edit.undo" })
  }

  const clear = () => {
    send({ type: "detour.edit.clear-detour" })
  }

  const reviewDetour = () => {
    send({ type: "detour.edit.done" })
  }

  const editDetour = () => {
    send({ type: "detour.edit.resume" })
  }

  const missedStops = finishedDetour?.missedStops || undefined

  const missedStopIds = missedStops
    ? new Set(missedStops.map((stop) => stop.id))
    : new Set()
  const stops = (routePattern?.shape?.stops || []).map((stop) => ({
    ...stop,
    missed: missedStopIds.has(stop.id),
  }))

  return {
    /** The current state machine snapshot */
    snapshot,
    send,

    /** Creates a new waypoint if all of the following criteria is met:
     * - {@link startPoint} is set
     * - {@link endPoint} is not set.
     */
    addWaypoint,
    insertWaypoint,
    moveWaypoint,
    deleteWaypoint,
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
     * The indexes of where the waypoints would be in detourShape generated by the routing API.
     */
    waypointIndexes: waypointIndexes,
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
      detourShape && isErr(detourShape) ? detourShape.err : undefined,

    unfinishedRouteSegments: unfinishedDetour?.unfinishedRouteSegments,

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

    finishedDetour,

    /** When present, puts this detour in "finished mode" */
    reviewDetour: snapshot.can({ type: "detour.edit.done" })
      ? reviewDetour
      : undefined,
    /** When present, puts this detour in "edit mode" */
    editDetour,

    /**
     * Detour duration as selected in the activate-detour flow
     */
    selectedDuration,
    /**
     * Detour reason as selected in the activate-detour flow
     */
    selectedReason,

    /**
     * Detour duration while editing is in progress
     */
    editedSelectedDuration,
  }
}
