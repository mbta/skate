import React, { useState } from "react"
import { RoutePattern, Shape } from "../../schedule"
import { LatLngExpression } from "leaflet"
import { Marker, Polyline, useMap, useMapEvent } from "react-leaflet"
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
  const [endPoint, setEndPoint] = useState<LatLngExpression | null>(null)
  const routeShapePositions: LatLngExpression[] = shape.points.map((point) => [
    point.lat,
    point.lon,
  ])
  const [detourPositions, setDetourPositions] = useState<LatLngExpression[]>([])

  const map = useMap()

  useMapEvent("click", (e) => {
    if (startPoint !== null && endPoint === null) {
      setDetourPositions((oldDetourPositions) =>
        oldDetourPositions.concat(e.latlng)
      )
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
              setStartPoint(position)
              setDetourPositions([position])
            } else {
              const position = closestPosition(
                routeShapePositions,
                e.latlng,
                map
              )
              setEndPoint(position)
              setDetourPositions((positions) => [...positions, position])
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
