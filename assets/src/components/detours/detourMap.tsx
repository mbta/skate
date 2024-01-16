import React, { useEffect, useState } from "react"
import { Shape, ShapePoint } from "../../schedule"
import { LatLngLiteral } from "leaflet"
import { Polyline, useMapEvents } from "react-leaflet"
import Leaflet from "leaflet"
import Map from "../map"
import { CustomControl } from "../map/controls/customControl"
import { Button } from "react-bootstrap"
import { ReactMarker } from "../map/utilities/reactMarker"
import { closestPosition } from "../../util/math"
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
  const onAddWaypoint = (p: LatLngLiteral) => {
    canAddWaypoint() && setWaypoints((positions) => [...positions, p])
  }

  const onAddConnectionPoint = (point: LatLngLiteral) => {
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
    onAddWaypoint,
    /**
     * Sets {@link startPoint} if unset.
     * Otherwise sets {@link endPoint} if unset.
     */
    onAddConnectionPoint,

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

export const DetourMap = ({ shape }: { shape: Shape }) => {
  const originalShape = shape.points.map(shapePointToLatLngLiteral)
  const {
    startPoint,
    endPoint,
    waypoints,

    onAddConnectionPoint,
    onAddWaypoint,

    canUndo,
    undoLastWaypoint,

    detourShape,
  } = useDetour()
  return (
    <Map vehicles={[]}>
      <CustomControl position="topleft" className="leaflet-bar">
        <Button
          variant="primary"
          disabled={canUndo === false}
          onClick={undoLastWaypoint}
        >
          Clear Last Waypoint
        </Button>
      </CustomControl>

      <MapEvents
        click={(e) => {
          onAddWaypoint(e.latlng)
        }}
      />

      {startPoint && <StartMarker position={startPoint} />}

      {waypoints.map((position) => (
        <DetourPointMarker key={position.toString()} position={position} />
      ))}

      {endPoint && <EndMarker position={endPoint} />}

      <Polyline
        positions={detourShape}
        className="c-detour_map--detour-route-shape"
      />

      <Polyline
        positions={originalShape}
        className="c-detour_map--original-route-shape"
        bubblingMouseEvents={false}
        eventHandlers={{
          click: (e) => {
            const { position } = closestPosition(originalShape, e.latlng) ?? {}
            position && onAddConnectionPoint(position)
          },
        }}
      />
    </Map>
  )
}

const MapEvents = (props: Leaflet.LeafletEventHandlerFnMap) => {
  useMapEvents(props)
  return null
}

const StartMarker = ({ position }: { position: LatLngLiteral }) => (
  <StartOrEndMarker
    classSuffix="start"
    title="Detour Start"
    position={position}
  />
)

const EndMarker = ({ position }: { position: LatLngLiteral }) => (
  <StartOrEndMarker classSuffix="end" title="Detour End" position={position} />
)

const StartOrEndMarker = ({
  classSuffix,
  title,
  position,
}: {
  classSuffix: string
  title: string
  position: LatLngLiteral
}) => (
  <ReactMarker
    interactive={false}
    position={position}
    divIconSettings={{
      iconSize: [20, 20],
      iconAnchor: new Leaflet.Point(10, 10),
      className: "c-detour_map-circle-marker--" + classSuffix,
    }}
    title={title}
    icon={
      <svg height="20" width="20">
        <circle cx={10} cy={10} r={10} />
      </svg>
    }
  />
)

const DetourPointMarker = ({ position }: { position: LatLngLiteral }) => (
  <ReactMarker
    interactive={false}
    position={position}
    divIconSettings={{
      iconSize: [10, 10],
      iconAnchor: new Leaflet.Point(5, 5),
      className: "c-detour_map-circle-marker--detour-point",
    }}
    icon={
      <svg height="10" width="10">
        <circle cx={5} cy={5} r={5} />
      </svg>
    }
  />
)
