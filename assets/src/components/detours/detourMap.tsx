import React, { useState } from "react"
import { RoutePattern, Shape } from "../../schedule"
import { LatLngExpression } from "leaflet"
import { Marker, Polyline, useMap, useMapEvent } from "react-leaflet"
import { Map as LeafletMap } from "leaflet"
import Map from "../map"

export const DetourMap = ({ routePattern }: { routePattern: RoutePattern }) => {
  const [startPoint, setStartPoint] = useState<LatLngExpression | null>(null)
  const [endPoint, setEndPoint] = useState<LatLngExpression | null>(null)
  const [detourPositions, setDetourPositions] = useState<LatLngExpression[]>([])

  const onAddDetourPosition = (p: LatLngExpression) =>
    setDetourPositions((positions) => [...positions, p])

  return routePattern.shape ? (
    <Map vehicles={[]}>
      <RouteShapeWithDetour
        shape={routePattern.shape}
        startPoint={startPoint}
        onSetStartPoint={setStartPoint}
        endPoint={endPoint}
        onSetEndPoint={setEndPoint}
        detourPositions={detourPositions}
        onAddDetourPosition={onAddDetourPosition}
      />
    </Map>
  ) : (
    <></>
  )
}

const RouteShapeWithDetour = ({
  shape,
  startPoint,
  onSetStartPoint,
  endPoint,
  onSetEndPoint,
  detourPositions,
  onAddDetourPosition,
}: {
  shape: Shape
  startPoint: LatLngExpression | null
  onSetStartPoint: (p: LatLngExpression | null) => void
  endPoint: LatLngExpression | null
  onSetEndPoint: (p: LatLngExpression | null) => void
  detourPositions: LatLngExpression[]
  onAddDetourPosition: (p: LatLngExpression) => void
}) => {
  const routeShapePositions: LatLngExpression[] = shape.points.map((point) => [
    point.lat,
    point.lon,
  ])

  const map = useMap()

  useMapEvent("click", (e) => {
    if (startPoint !== null && endPoint === null) {
      onAddDetourPosition(e.latlng)
    }
  })

  return (
    <>
      <Polyline
        positions={routeShapePositions}
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
      />
      {startPoint && <Marker position={startPoint} />}
      {endPoint && <Marker position={endPoint} />}
      <Polyline positions={detourPositions} />
    </>
  )
}

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
