import { useEffect, useMemo, useState } from "react"
import { ShapePoint } from "../schedule"
import { fetchDetourDirections, fetchFinishedDetour } from "../api"
import { DetourShape, FinishedDetour, OriginalRoute } from "../models/detour"
import {
  ok,
  FetchResult,
  isOk,
  isFetchError,
  loading,
  isLoading,
} from "../util/fetchResult"

const useDetourDirections = (
  shapePoints: ShapePoint[]
): FetchResult<DetourShape> => {
  const [detourShape, setDetourShape] = useState<FetchResult<DetourShape>>(
    loading()
  )

  useEffect(() => {
    let shouldUpdate = true

    if (shapePoints.length < 2) {
      // We expect not to have any directions or shape if we don't have at
      // least two points to route between
      setDetourShape(ok({ coordinates: [], directions: undefined }))
      return
    }

    fetchDetourDirections(shapePoints).then((detourInfo) => {
      if (shouldUpdate && !isLoading(detourInfo)) {
        setDetourShape(detourInfo)
      }
    })

    return () => {
      shouldUpdate = false
    }
  }, [shapePoints])

  return detourShape
}

export enum DetourState {
  Edit,
  Finished,
}

export const useDetour = ({ routePatternId, shape }: OriginalRoute) => {
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

  const detourShape = useDetourDirections(
    useMemo(
      () =>
        [startPoint, ...waypoints, endPoint].filter(
          (v): v is ShapePoint => !!v
        ),
      [startPoint, waypoints, endPoint]
    ) ?? []
  )

  const coordinates = isOk(detourShape) ? detourShape.ok.coordinates : []
  const directions = isOk(detourShape) ? detourShape.ok.directions : undefined

  const canAddWaypoint = () => startPoint !== null && endPoint === null
  const addWaypoint = canAddWaypoint()
    ? (p: ShapePoint) => {
        setWaypoints((positions) => [...positions, p])
      }
    : undefined

  const addConnectionPoint = (point: ShapePoint) => {
    if (startPoint === null) {
      setStartPoint(point)
    } else if (endPoint === null) {
      setEndPoint(point)
    }
  }

  const canUndo = startPoint !== null && state === DetourState.Edit

  const undo = () => {
    if (!canUndo) return

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
    setState(DetourState.Edit)
  }

  const missedStops = finishedDetour?.missedStops || []

  const missedStopIds = new Set(missedStops.map((stop) => stop.id))
  const stops = (shape.stops || []).map((stop) => ({
    ...stop,
    missed: missedStopIds.has(stop.id),
  }))

  type Radian = number
  type RadianShapePoint = {
    lat: Radian
    lon: Radian
  }

  const bearing = (
    { lon: λ1, lat: φ1 }: RadianShapePoint,
    { lon: λ2, lat: φ2 }: RadianShapePoint
  ) => {
    // Formula:
    //          θ = atan2( sin Δλ ⋅ cos φ2 , cos φ1 ⋅ sin φ2 − sin φ1 ⋅ cos φ2 ⋅ cos Δλ )
    // where
    // φ1,λ1:
    //              is the start point,
    // φ2,λ2:
    //              the end point
    // (Δλ is the difference in longitude)
    // (all angles in radians)
    const y = Math.sin(λ2 - λ1) * Math.cos(φ2)
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
    const θ = Math.atan2(y, x)
    // const brng = ((θ * 180) / Math.PI + 360) % 360 // in degrees
    return θ
  }

  const shapePointToRadianShapePoint = ({
    lat,
    lon,
  }: ShapePoint): RadianShapePoint => ({
    lat: lat * (Math.PI / 180),
    lon: lon * (Math.PI / 180),
  })

  const bearingDeg = (start: RadianShapePoint, end: RadianShapePoint) => {

    const brng = -bearing(
      start,
      end,
    )

    const radToDeg = (v: number) => v * (180/Math.PI)

    const raddegToWorldDeg = (v: number) => (v - 180) % 360

    return -raddegToWorldDeg(radToDeg(brng))
  }

  const lastHeading =
    coordinates.length > 0
      ? bearingDeg(
          shapePointToRadianShapePoint(coordinates[coordinates.length - 1]),
          shapePointToRadianShapePoint(coordinates[coordinates.length - 2])
        )
      : undefined

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
    addConnectionPoint:
      state === DetourState.Finished ? undefined : addConnectionPoint,

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
     * Indicates if there was an error fetching directions from ORS
     */
    routingError: isFetchError(detourShape),

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
    undo: state === DetourState.Finished ? undefined : undo,
    /**
     * Clears the entire detour
     */
    clear: state === DetourState.Finished ? undefined : clear,
    /** When present, puts this detour in "finished mode" */
    finishDetour: endPoint !== null ? finishDetour : undefined,
    /** When present, puts this detour in "edit mode" */
    editDetour: state === DetourState.Finished ? editDetour : undefined,

    lastHeading,
  }
}
