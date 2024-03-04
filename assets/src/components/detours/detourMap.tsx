import React, { PropsWithChildren, useId } from "react"
import { LatLngLiteral, LeafletMouseEvent } from "leaflet"
import { Polyline, useMapEvents } from "react-leaflet"
import Leaflet from "leaflet"
import Map from "../map"
import { CustomControl } from "../map/controls/customControl"
import { Button } from "react-bootstrap"
import { ReactMarker } from "../map/utilities/reactMarker"
import { closestPosition } from "../../util/math"
import { ShapePoint } from "../../schedule"
import {
  latLngLiteralToShapePoint,
  shapePointToLatLngLiteral,
} from "../../util/pointLiterals"
import { MapTooltip } from "../map/tooltip"
import { joinClasses } from "../../helpers/dom"
import { RouteSegments } from "../../models/detour"

interface DetourMapProps {
  /**
   * Coordinates to display as the original route.
   */
  originalShape: ShapePoint[]
  /**
   * Coordinates to display as the detour line.
   */
  detourShape: ShapePoint[]

  /**
   * Coordinate to display as the beginning connection point.
   */
  startPoint?: ShapePoint

  /**
   * Coordinate to display as the ending connection point.
   */
  endPoint?: ShapePoint

  /**
   * Coordinates to display as the waypoints.
   */
  waypoints: ShapePoint[]

  /**
   * User signal to show whether the original shape should be
   * highlighted
   */
  originalShapeClickable: boolean

  /**
   * Three partial route-shape segments: before, during, and after the detour
   */
  routeSegments?: RouteSegments

  /**
   * Callback fired when the {@link originalShape} is clicked.
   */
  onClickOriginalShape: (point: ShapePoint) => void

  /**
   * Callback fired when the map is clicked.
   * @param point
   */
  onClickMap: (point: ShapePoint) => void

  /**
   * User signal to describe the state of the undo button.
   */
  undoDisabled: boolean
  /**
   * Callback fired when the undo button is clicked.
   */
  onUndo: () => void
  /**
   * Callback fired when the clear button is clicked.
   */
  onClear: () => void

  /*
   * Center and zoom to position the map correctly when it renders
   */
  center: LatLngLiteral
  zoom: number
}

export const DetourMap = ({
  originalShape,
  detourShape,

  startPoint,
  endPoint,
  waypoints,

  originalShapeClickable,
  onClickOriginalShape,
  onClickMap,

  routeSegments,

  undoDisabled,
  onUndo,
  onClear,

  center,
  zoom,
}: DetourMapProps) => {
  const id = useId()

  return (
    <Map vehicles={[]} allowStreetView center={center} zoom={zoom}>
      <CustomControl position="topleft" className="leaflet-bar">
        <Button variant="primary" disabled={undoDisabled} onClick={onUndo}>
          Undo
        </Button>
        <Button variant="primary" disabled={undoDisabled} onClick={onClear}>
          Clear
        </Button>
      </CustomControl>

      <MapEvents
        click={(e) => {
          onClickMap(latLngLiteralToShapePoint(e.latlng))
        }}
      />

      {startPoint && (
        <StartMarker position={shapePointToLatLngLiteral(startPoint)} />
      )}

      {waypoints.map((position) => (
        <DetourPointMarker
          key={JSON.stringify(position)}
          position={shapePointToLatLngLiteral(position)}
        />
      ))}

      {endPoint && <EndMarker position={shapePointToLatLngLiteral(endPoint)} />}

      <Polyline
        positions={detourShape.map(shapePointToLatLngLiteral)}
        className="c-detour_map--detour-route-shape"
      />

      {routeSegments ? (
        <DivertedRouteShape segments={routeSegments}></DivertedRouteShape>
      ) : (
        <OriginalRouteShape
          positions={originalShape.map(shapePointToLatLngLiteral)}
          key={`detour-map-original-route-shape-${id}-${
            startPoint === undefined
          }`}
          classNames={
            startPoint === undefined
              ? ["c-detour_map--original-route-shape__unstarted"]
              : []
          }
          clickable={originalShapeClickable}
          onClick={(e) => {
            const { position } =
              closestPosition(
                originalShape.map(shapePointToLatLngLiteral),
                e.latlng
              ) ?? {}
            position &&
              onClickOriginalShape(latLngLiteralToShapePoint(position))
          }}
        >
          {!startPoint && <MapTooltip>Click to start detour</MapTooltip>}
        </OriginalRouteShape>
      )}
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

interface OriginalRouteShapeProps extends PropsWithChildren {
  key: string
  positions: LatLngLiteral[]
  classNames: string[]
  clickable: boolean
  onClick: (e: LeafletMouseEvent) => void
}

const OriginalRouteShape = ({
  positions,
  children,
  classNames,
  clickable,
  onClick,
}: OriginalRouteShapeProps) => (
  <>
    <Polyline
      weight={6}
      positions={positions}
      className="c-detour_map--original-route-shape-core"
    />
    {clickable && (
      <Polyline
        positions={positions}
        weight={16}
        className={joinClasses([
          "c-detour_map--original-route-shape",
          ...classNames,
        ])}
        bubblingMouseEvents={false}
        eventHandlers={{
          click: onClick,
        }}
      >
        {children}
      </Polyline>
    )}
  </>
)

interface DivertedRouteShapeProps extends PropsWithChildren {
  segments: RouteSegments
}

const DivertedRouteShape = ({
  segments: { beforeDetour, detour, afterDetour },
}: DivertedRouteShapeProps) => (
  <>
    <Polyline
      weight={6}
      interactive={false}
      positions={beforeDetour.map(shapePointToLatLngLiteral)}
      className="c-detour_map--original-route-shape-core"
    />
    <Polyline
      weight={3}
      interactive={false}
      positions={detour.map(shapePointToLatLngLiteral)}
      className="c-detour_map--original-route-shape-diverted"
    />
    <Polyline
      weight={6}
      interactive={false}
      positions={afterDetour.map(shapePointToLatLngLiteral)}
      className="c-detour_map--original-route-shape-core"
    />
  </>
)
