import React, { PropsWithChildren, ReactNode, useContext, useId } from "react"
import { LatLngLiteral, LeafletMouseEvent, PointTuple } from "leaflet"
import { Marker, Polyline, useMapEvents } from "react-leaflet"
import Leaflet from "leaflet"
import Map from "../map"
import { CustomControl } from "../map/controls/customControl"
import { ReactMarker } from "../map/utilities/reactMarker"
import { ShapePoint, Stop } from "../../schedule"
import {
  latLngLiteralToShapePoint,
  shapePointToLatLngLiteral,
} from "../../util/pointLiterals"
import { MapTooltip } from "../map/tooltip"
import { joinClasses } from "../../helpers/dom"
import { RouteSegments } from "../../models/detour"
import { MapButton } from "../map/controls/mapButton"
import { ArrowLeftSquare, XSquare } from "../../helpers/bsIcons"
import ZoomLevelWrapper from "../ZoomLevelWrapper"
import { StopMarkerWithStopCard } from "../map/markers/stopMarker"
import {
  LayersControl,
  LayersControlState,
} from "../map/controls/layersControl"
import { TileType } from "../../tilesetUrls"
import { setTileType } from "../../state/mapLayersState"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { uniqBy } from "../../helpers/array"

interface DetourMapProps {
  /**
   * Coordinates to display as the original route.
   */
  originalShape: ShapePoint[]
  /**
   * Coordinates to display as the detour line.
   */
  detourShape: ShapePoint[]

  /*
   * Stops along the original route shape
   */
  stops: (Stop & { missed: boolean })[]

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
  onClickMap?: (point: ShapePoint) => void

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

  lastHeading: number | undefined
}

export const DetourMap = ({
  originalShape,
  detourShape,

  stops,

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
  lastHeading,
}: DetourMapProps) => {
  const id = useId()

  const [
    {
      mapLayers: {
        detourMap: { tileType: tileType },
      },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  return (
    <div
      className={joinClasses([
        "h-100",
        onClickMap && "c-detour_map--map__clickable",
      ])}
    >
      <Map
        vehicles={[]}
        allowStreetView
        center={center}
        zoom={zoom}
        tileType={tileType}
      >
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

        <LayersControlState>
          {(open, setOpen) => (
            <LayersControl.WithTileContext
              showLayersList={open}
              onChangeLayersListVisibility={setOpen}
              onChangeTileType={(tileType: TileType) =>
                dispatch(setTileType("detourMap", tileType))
              }
            />
          )}
        </LayersControlState>

        <MapEvents
          click={(e) => {
            onClickMap?.(latLngLiteralToShapePoint(e.latlng))
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

        {lastHeading && <>
          <ReactMarker position={shapePointToLatLngLiteral(detourShape[detourShape.length - 1]!)} divIconSettings={{iconAnchor: [-20, 30] as PointTuple}} icon={<>{lastHeading}</>}>{lastHeading}</ReactMarker>
        </>}

        {endPoint && (
          <EndMarker position={shapePointToLatLngLiteral(endPoint)} />
        )}

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
              onClickOriginalShape(latLngLiteralToShapePoint(e.latlng))
            }}
          >
            {!startPoint && <MapTooltip>Click to start detour</MapTooltip>}
          </OriginalRouteShape>
        )}

        <ZoomLevelWrapper>
          {(zoomLevel: number) => (
            <>
              {uniqBy(stops, (stop) => stop.id).map((stop) => (
                <StopMarkerWithStopCard
                  key={stop.name}
                  stop={stop}
                  zoomLevel={zoomLevel}
                  interactionStatesDisabled={false}
                  missed={stop.missed}
                />
              ))}
            </>
          )}
        </ZoomLevelWrapper>
      </Map>
    </div>
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
    height="100%"
    width="100%"
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
    width="100%"
    height="100%"
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
