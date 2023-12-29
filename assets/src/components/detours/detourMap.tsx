import React, { useEffect, useState } from "react"
import { Shape, ShapePoint } from "../../schedule"
import { LatLngLiteral } from "leaflet"
import { Polyline, useMapEvent } from "react-leaflet"
import Leaflet from "leaflet"
import Map from "../map"
import { CustomControl } from "../map/controls/customControl"
import { Button } from "react-bootstrap"
import { ReactMarker } from "../map/utilities/reactMarker"
import { closestPosition } from "../../util/math"
import { fetchDetourDirections } from "../../api"

export const DetourMap = ({ shape }: { shape: Shape }) => {
  const [startPoint, setStartPoint] = useState<LatLngLiteral | null>(null)
  const [endPoint, setEndPoint] = useState<LatLngLiteral | null>(null)
  const [detourPositions, setDetourPositions] = useState<LatLngLiteral[]>([])
  const [orsPositions, setOrsPositions] = useState<LatLngLiteral[]>([])

  const onAddDetourPosition = (p: LatLngLiteral) => {
    setDetourPositions((positions) => [...positions, p])
  }

  useEffect(() => {
    const shapePoints: ShapePoint[] = detourPositions.map(
      (waypoint: LatLngLiteral) => {
        const { lat, lng } = waypoint
        return { lat, lon: lng }
      }
    )

    fetchDetourDirections(shapePoints).then((detourShape) => {
      if (detourShape) {
        setOrsPositions(
          detourShape.coordinates.map((position: ShapePoint) => {
            const { lat, lon } = position
            return { lat, lng: lon }
          })
        )
      }
    })
  }, [detourPositions])

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
        orsPositions={orsPositions}
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
  orsPositions,
}: {
  originalShape: Shape
  startPoint: LatLngLiteral | null
  onSetStartPoint: (p: LatLngLiteral | null) => void
  endPoint: LatLngLiteral | null
  onSetEndPoint: (p: LatLngLiteral | null) => void
  detourPositions: LatLngLiteral[]
  onAddDetourPosition: (p: LatLngLiteral) => void
  orsPositions: LatLngLiteral[]
}) => {
  const routeShapePositions: LatLngLiteral[] = originalShape.points.map(
    (point) => ({
      lat: point.lat,
      lng: point.lon,
    })
  )

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
      : detourPositions.slice(1, -1)

  return (
    <>
      <Polyline
        positions={routeShapePositions}
        className="c-detour_map--original-route-shape"
        eventHandlers={{
          click: (e) => {
            if (startPoint === null) {
              const { position } =
                closestPosition(routeShapePositions, e.latlng) ?? {}

              position && onSetStartPoint(position)
              position && onAddDetourPosition(position)
            } else if (endPoint === null) {
              const { position } =
                closestPosition(routeShapePositions, e.latlng) ?? {}

              position && onSetEndPoint(position)
              position && onAddDetourPosition(position)
            }
          },
        }}
        bubblingMouseEvents={false}
      />
      {startPoint && <StartMarker position={startPoint} />}
      {endPoint && <EndMarker position={endPoint} />}
      <Polyline
        positions={orsPositions}
        className="c-detour_map--detour-route-shape"
      />
      {uniqueDetourPositions.map((position) => (
        <DetourPointMarker key={position.toString()} position={position} />
      ))}
    </>
  )
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
