import React, { useEffect, useState } from "react"
import { DiversionPanel, DiversionPanelProps } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { Shape, ShapePoint } from "../../schedule"
import { LatLngLiteral } from "leaflet"
import { fetchDetourDirections } from "../../api"
import {
  latLngLiteralToShapePoint,
  shapePointToLatLngLiteral,
} from "../../util/pointLiterals"

const useDetourDirections = (shapePoints: ShapePoint[]) => {
  const [detourShape, setDetourShape] = useState<LatLngLiteral[]>([])

  useEffect(() => {
    let shouldUpdate = true

    fetchDetourDirections(shapePoints).then((detourShape) => {
      if (detourShape && shouldUpdate) {
        setDetourShape(detourShape.coordinates.map(shapePointToLatLngLiteral))
      }
    })

    return () => {
      shouldUpdate = false
    }
  }, [shapePoints])

  return detourShape
}

const useDetour = () => {
  const [startPoint, setStartPoint] = useState<LatLngLiteral | null>(null)
  const [endPoint, setEndPoint] = useState<LatLngLiteral | null>(null)
  const [waypoints, setWaypoints] = useState<LatLngLiteral[]>([])

  const detourShape = useDetourDirections(
    [startPoint, ...waypoints, endPoint]
      .filter((v): v is LatLngLiteral => !!v)
      .map(latLngLiteralToShapePoint)
  )

  const canAddWaypoint = () => startPoint !== null && endPoint === null
  const addWaypoint = (p: LatLngLiteral) => {
    canAddWaypoint() && setWaypoints((positions) => [...positions, p])
  }

  const addConnectionPoint = (point: LatLngLiteral) => {
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
    addWaypoint: addWaypoint,
    /**
     * Sets {@link startPoint} if unset.
     * Otherwise sets {@link endPoint} if unset.
     */
    addConnectionPoint: addConnectionPoint,

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
          originalShape={shape.points.map(shapePointToLatLngLiteral)}
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
