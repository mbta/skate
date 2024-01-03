import React, { useState } from "react"
import { Shape } from "../../schedule"
import { LatLngExpression } from "leaflet"
import { Polyline, useMap, useMapEvent } from "react-leaflet"
import Leaflet, { Map as LeafletMap } from "leaflet"
import Map from "../map"
import { CustomControl } from "../map/controls/customControl"
import { Button } from "react-bootstrap"
import { ReactMarker } from "../map/utilities/reactMarker"

export const DetourMap = ({ shape }: { shape: Shape }) => {
  const [startPoint, setStartPoint] = useState<LatLngExpression | null>(null)
  const [endPoint, setEndPoint] = useState<LatLngExpression | null>(null)
  const [detourPositions, setDetourPositions] = useState<LatLngExpression[]>([])

  const onAddDetourPosition = (p: LatLngExpression) =>
    setDetourPositions((positions) => [...positions, p])

  return (
    <Map vehicles={[]}>
      <CustomControl position="topleft" className="leaflet-bar">
        <Button
          variant="primary"
          disabled={
            startPoint === null ||
            endPoint !== null ||
            detourPositions.length === 1
          }
          onClick={() =>
            setDetourPositions((positions) =>
              positions.slice(0, positions.length - 1)
            )
          }
        >
          Clear Last Waypoint
        </Button>
      </CustomControl>
      <RouteShapeWithDetour
        originalShape={shape}
        startPoint={startPoint}
        onSetStartPoint={setStartPoint}
        endPoint={endPoint}
        onSetEndPoint={setEndPoint}
        detourPositions={detourPositions}
        onAddDetourPosition={onAddDetourPosition}
      />
    </Map>
  )
}

const RouteShapeWithDetour = ({
  originalShape,
  startPoint,
  onSetStartPoint,
  endPoint,
  onSetEndPoint,
  detourPositions,
  onAddDetourPosition,
}: {
  originalShape: Shape
  startPoint: LatLngExpression | null
  onSetStartPoint: (p: LatLngExpression | null) => void
  endPoint: LatLngExpression | null
  onSetEndPoint: (p: LatLngExpression | null) => void
  detourPositions: LatLngExpression[]
  onAddDetourPosition: (p: LatLngExpression) => void
}) => {
  const routeShapePositions: LatLngExpression[] = originalShape.points.map(
    (point) => [point.lat, point.lon]
  )

  const map = useMap()

  useMapEvent("click", (e) => {
    if (startPoint !== null && endPoint === null) {
      onAddDetourPosition(e.latlng)
    }
  })

  // points on the detour not already represented by the start and end
  const uniqueDetourPositions =
    detourPositions.length === 0
      ? []
      : endPoint === null
      ? detourPositions.slice(1)
      : detourPositions.slice(1, -2)

  return (
    <>
      <Polyline
        positions={routeShapePositions}
        className="c-detour_map--original-route-shape"
        eventHandlers={{
          click: (e) => {
            if (startPoint === null) {
              const position = closestPosition(
                routeShapePositions,
                e.latlng,
                map
              )
              onSetStartPoint(position)
              position && onAddDetourPosition(position)
            } else if (endPoint === null) {
              const position = closestPosition(
                routeShapePositions,
                e.latlng,
                map
              )
              onSetEndPoint(position)
              position && onAddDetourPosition(position)
            }
          },
        }}
        bubblingMouseEvents={false}
      />
      {startPoint && <StartMarker position={startPoint} />}
      {endPoint && <EndMarker position={endPoint} />}
      <Polyline
        positions={detourPositions}
        className="c-detour_map--detour-route-shape"
      />
      {uniqueDetourPositions.map((position) => (
        <DetourPointMarker key={position.toString()} position={position} />
      ))}
    </>
  )
}

const StartMarker = ({ position }: { position: LatLngExpression }) => (
  <StartOrEndMarker
    classSuffix="start"
    title="Detour Start"
    position={position}
  />
)

const EndMarker = ({ position }: { position: LatLngExpression }) => (
  <StartOrEndMarker classSuffix="end" title="Detour End" position={position} />
)

const StartOrEndMarker = ({
  classSuffix,
  title,
  position,
}: {
  classSuffix: string
  title: string
  position: LatLngExpression
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

const DetourPointMarker = ({ position }: { position: LatLngExpression }) => (
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

const closestPosition = (
  positions: LatLngExpression[],
  position: LatLngExpression,
  map: LeafletMap
): LatLngExpression | null => {
  const [closestPosition] = positions.reduce<
    [LatLngExpression | null, number | null]
  >(
    ([closestPosition, closestDistance], currentPosition) => {
      const distance = map.distance(position, currentPosition)
      if (closestDistance === null || distance < closestDistance) {
        return [position, distance]
      } else {
        return [closestPosition, closestDistance]
      }
    },
    [null, null]
  )

  return closestPosition
}
