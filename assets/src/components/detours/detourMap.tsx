import React, { useState } from "react"
import { RoutePattern, Shape } from "../../schedule"
import { LatLngExpression } from "leaflet"
import { Marker, Polyline, useMap } from "react-leaflet"
import { Map as LeafletMap } from "leaflet"
import Map from "../map"

export const DetourMap = ({ routePattern }: { routePattern: RoutePattern }) => {
  return routePattern.shape ? (
    <Map vehicles={[]}>
      <DraggableRouteShape shape={routePattern.shape} />
    </Map>
  ) : (
    <></>
  )
}

const DraggableRouteShape = ({ shape }: { shape: Shape }) => {
  const [startPoint, setStartPoint] = useState<LatLngExpression | null>(null)

  const positions: LatLngExpression[] = shape.points.map((point) => [
    point.lat,
    point.lon,
  ])

  const map = useMap()

  return (
    <>
      <Polyline
        positions={positions}
        eventHandlers={{
          click: (e) => {
            if (startPoint === null) {
              setStartPoint(closestPosition(positions, e.latlng, map))
            }
          },
        }}
      />
      {startPoint && <Marker position={startPoint} />}
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
