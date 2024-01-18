import React, { useEffect, useMemo, useState } from "react"
import { DiversionPanel, DiversionPanelProps } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { Shape, ShapePoint } from "../../schedule"
import { fetchDetourDirections } from "../../api"

const useDetourDirections = (shapePoints: ShapePoint[]) => {
  const [detourShape, setDetourShape] = useState<ShapePoint[]>([])

  useEffect(() => {
    let shouldUpdate = true

    fetchDetourDirections(shapePoints).then((detourShape) => {
      if (detourShape && shouldUpdate) {
        setDetourShape(detourShape.coordinates)
      }
    })

    return () => {
      shouldUpdate = false
    }
  }, [shapePoints])

  return detourShape
}

export const useDetour = () => {
  const [startPoint, setStartPoint] = useState<ShapePoint | null>(null)
  const [endPoint, setEndPoint] = useState<ShapePoint | null>(null)
  const [waypoints, setWaypoints] = useState<ShapePoint[]>([])

  const detourShape = useDetourDirections(
    useMemo(
      () =>
        [startPoint, ...waypoints, endPoint].filter(
          (v): v is ShapePoint => !!v
        ),
      [startPoint, waypoints, endPoint]
    )
  )

  const canAddWaypoint = () => startPoint !== null && endPoint === null
  const addWaypoint = (p: ShapePoint) => {
    canAddWaypoint() && setWaypoints((positions) => [...positions, p])
  }

  const addConnectionPoint = (point: ShapePoint) => {
    if (startPoint === null) {
      setStartPoint(point)
    } else if (endPoint === null) {
      setEndPoint(point)
    }
  }

  const canUndo =
    startPoint !== null && endPoint === null && waypoints.length > 0

  const undoLastWaypoint = () => {
    canUndo &&
      setWaypoints((positions) => positions.slice(0, positions.length - 1))
  }

  return {
    /**
     * Creates a new waypoint if all of the following criteria is met:
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
    detourShape,

    /**
     * Reports if {@link undoLastWaypoint} will do anything.
     */
    canUndo,
    /**
     * Removes the last waypoint in {@link waypoints} if {@link canUndo} is `true`.
     */
    undoLastWaypoint,
  }
}

export const DiversionPage = ({
  directions,
  missedStops,
  routeName,
  routeDescription,
  routeDirection,
  routeOrigin,
  shape,
}: DiversionPanelProps & { shape: Shape }) => {
  const {
    addConnectionPoint,
    addWaypoint,

    startPoint,
    endPoint,
    waypoints,

    detourShape,

    canUndo,
    undoLastWaypoint,
  } = useDetour()

  return (
    <article className="l-diversion-page h-100 border-box">
      <header className="l-diversion-page__header text-bg-light border-bottom">
        <h1 className="h3 text-center">Create Detour</h1>
      </header>
      <div className="l-diversion-page__panel bg-light">
        <DiversionPanel
          directions={directions}
          missedStops={missedStops}
          routeName={routeName}
          routeDescription={routeDescription}
          routeOrigin={routeOrigin}
          routeDirection={routeDirection}
        />
      </div>
      <div className="l-diversion-page__map">
        <DetourMap
          originalShape={shape.points}
          detourShape={detourShape}
          startPoint={startPoint ?? undefined}
          endPoint={endPoint ?? undefined}
          waypoints={waypoints}
          onClickMap={addWaypoint}
          onClickOriginalShape={addConnectionPoint}
          undoDisabled={canUndo === false}
          onUndoLastWaypoint={undoLastWaypoint}
        />
      </div>
    </article>
  )
}
