import React, { PropsWithChildren, ReactNode, useId } from "react"
import { LatLngLiteral, LeafletMouseEvent } from "leaflet"
import { Polyline, useMapEvents } from "react-leaflet"
import Leaflet from "leaflet"
import Map from "../map"
import { CustomControl } from "../map/controls/customControl"
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
import { MapButton } from "../map/controls/mapButton"
import { ArrowLeftSquare, XSquare } from "../../helpers/bsIcons"

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
      <CustomControl position="bottomleft" className="leaflet-bar">
        <MapButton
          disabled={undoDisabled}
          onClick={onUndo}
          size="lg"
          title="Undo"
        >
          <ArrowLeftSquare />
        </MapButton>
      </CustomControl>
      <CustomControl position="bottomleft" className="leaflet-bar">
        <MapButton
          disabled={undoDisabled}
          onClick={onClear}
          size="lg"
          title="Clear"
        >
          <XSquare />
        </MapButton>
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
        <WaypointMarker
          key={JSON.stringify(position)}
          position={shapePointToLatLngLiteral(position)}
        />
      ))}

      {endPoint && <EndMarker position={shapePointToLatLngLiteral(endPoint)} />}

      <Polyline
        positions={detourShape.map(shapePointToLatLngLiteral)}
        weight={6}
        interactive={false}
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
              : ["c-detour_map--original-route-shape__unfinished"]
          }
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

export const StartMarker = ({ position }: { position: LatLngLiteral }) => (
  <StartOrEndMarker
    title="Detour Start"
    position={position}
    icon={<StartIcon />}
  />
)

export const EndMarker = ({ position }: { position: LatLngLiteral }) => (
  <StartOrEndMarker title="Detour End" position={position} icon={<EndIcon />} />
)

const StartOrEndMarker = ({
  title,
  position,
  icon,
}: {
  title: string
  position: LatLngLiteral
  icon: ReactNode
}) => (
  <ReactMarker
    interactive={false}
    position={position}
    divIconSettings={{
      iconSize: [16, 16],
      iconAnchor: new Leaflet.Point(8, 8),
      className: "",
    }}
    title={title}
    icon={icon}
  />
)

export const StartIcon = () => <StartOrEndIcon classSuffix={"start"} />
export const EndIcon = () => <StartOrEndIcon classSuffix={"end"} />

const StartOrEndIcon = ({ classSuffix }: { classSuffix: string }) => (
  <svg
    height="16"
    width="16"
    viewBox="0 0 16 16"
    className={"c-detour_map-circle-marker--" + classSuffix}
  >
    <circle cx={8} cy={8} r={7.5} opacity={0.5} />
    <circle cx={8} cy={8} r={6} stroke="white" strokeWidth={2} />
  </svg>
)

const WaypointMarker = ({ position }: { position: LatLngLiteral }) => (
  <ReactMarker
    interactive={false}
    position={position}
    divIconSettings={{
      iconSize: [10, 10],
      iconAnchor: new Leaflet.Point(5, 5),
      className: "",
    }}
    icon={<WaypointIcon />}
  />
)

export const WaypointIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    className="c-detour_map-circle-marker--detour-point"
  >
    <circle cx={5} cy={5} r={4.5} />
  </svg>
)

interface OriginalRouteShapeProps extends PropsWithChildren {
  positions: LatLngLiteral[]
  classNames: string[]
  onClick: (e: LeafletMouseEvent) => void
}

const OriginalRouteShape = ({
  positions,
  children,
  classNames,
  onClick,
}: OriginalRouteShapeProps) => (
  <>
    <Polyline
      weight={6}
      positions={positions}
      className="c-detour_map--original-route-shape-core"
    />
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
