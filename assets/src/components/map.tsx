import Leaflet, { LatLngExpression, Map as LeafletMap } from "leaflet"
import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import React, {
  MutableRefObject,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  CircleMarker,
  Map as ReactLeafletMap,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
} from "react-leaflet"
// @ts-ignore
import Control from "react-leaflet-control"
// @ts-ignore
import FullscreenControl from "react-leaflet-fullscreen"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import vehicleLabelString from "../helpers/vehicleLabel"
import { drawnStatus, statusClass } from "../models/vehicleStatus"
import { TrainVehicle, Vehicle, VehicleId } from "../realtime.d"
import { Shape } from "../schedule"
import { Settings } from "../settings"
import { selectVehicle } from "../state"

export interface Props {
  vehicles: Vehicle[]
  shapes?: Shape[]
  // secondaryVehicles are smaller, deemphasized, and don't affect autocentering
  secondaryVehicles?: Vehicle[]
  // trainVehicles are white, don't get a label, and don't affect autocentering
  trainVehicles?: TrainVehicle[]
  reactLeafletRef?: MutableRefObject<ReactLeafletMap | null>
}

export const defaultCenter: LatLngExpression = {
  lat: 42.360718,
  lng: -71.05891,
}

const makeVehicleIcon = (
  vehicle: Vehicle,
  isPrimary: boolean
): Leaflet.DivIcon => {
  const centerX = 12
  const centerY = 12
  return Leaflet.divIcon({
    html: `<svg
        height="24"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          class="${statusClass(drawnStatus(vehicle))}"
          d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
          transform="scale(${isPrimary ? 1.0 : 0.8}) rotate(${
      vehicle.bearing
    }) translate(${-centerX}, ${-centerY})"
        />
      </svg>`,
    iconAnchor: [0, 0],
    className: "m-vehicle-map__icon",
  })
}

const makeLabelIcon = (
  vehicle: Vehicle,
  isPrimary: boolean,
  settings: Settings,
  selectedVehicleId?: VehicleId
): Leaflet.DivIcon => {
  const labelString = vehicleLabelString(vehicle, settings)
  const labelBackgroundHeight = isPrimary ? 16 : 12
  const labelBackgroundWidth =
    labelString.length <= 4 ? (isPrimary ? 40 : 30) : isPrimary ? 62 : 40
  const selectedClass = vehicle.id === selectedVehicleId ? "selected" : ""
  return Leaflet.divIcon({
    className: className([
      "m-vehicle-map__label",
      isPrimary ? "primary" : "secondary",
      selectedClass,
    ]),
    html: `<svg viewBox="0 0 ${labelBackgroundWidth} ${labelBackgroundHeight}" width="${labelBackgroundWidth}" height="${labelBackgroundHeight}">
            <rect
                class="m-vehicle-icon__label-background"
                width="100%" height="100%"
                rx="5.5px" ry="5.5px"
              />
            <text class="m-vehicle-icon__label" x="50%" y="50%" text-anchor="middle" dominant-baseline="central">
              ${labelString}
            </text>
          </svg>`,
    iconAnchor: [labelBackgroundWidth / 2, isPrimary ? -16 : -10],
  })
}

const Vehicle = ({
  vehicle,
  isPrimary,
}: {
  vehicle: Vehicle
  isPrimary: boolean
}) => {
  const [appState, dispatch] = useContext(StateDispatchContext)
  const select = isPrimary
    ? () => dispatch(selectVehicle(vehicle.id))
    : // tslint:disable-next-line: no-empty
      () => {}
  const position: LatLngExpression = [vehicle.latitude, vehicle.longitude]
  const vehicleIcon: Leaflet.DivIcon = makeVehicleIcon(vehicle, isPrimary)
  const labelIcon: Leaflet.DivIcon = makeLabelIcon(
    vehicle,
    isPrimary,
    appState.settings,
    appState.selectedVehicleId
  )
  const zIndexOffset = isPrimary ? 2000 : 0
  return (
    <>
      <Marker
        position={position}
        icon={vehicleIcon}
        onClick={select}
        zIndexOffset={zIndexOffset}
      />
      <Marker
        position={position}
        icon={labelIcon}
        onClick={select}
        zIndexOffset={zIndexOffset}
      />
    </>
  )
}

const makeTrainVehicleIcon = ({ bearing }: TrainVehicle): Leaflet.DivIcon => {
  const centerX = 24
  const centerY = 24
  return Leaflet.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 36 36">
        <g transform="rotate(${bearing}, ${centerX}, ${centerY})">
          <path fill="#fff" d="m42.88 45.83a2.1 2.1 0 0 1 -.87-.19l-15.92-7.17a5.23 5.23 0 0 0 -2.09-.47 5.14 5.14 0 0 0 -2.08.44l-15.92 7.2a2.1 2.1 0 0 1 -.87.19 2.14 2.14 0 0 1 -1.76-1 2 2 0 0 1 -.12-2l18.86-40.83a2.08 2.08 0 0 1 3.78 0l18.87 40.87a2 2 0 0 1 -.12 2 2.14 2.14 0 0 1 -1.76.96z"/>
        </g>
    </svg>`,
    className: "m-vehicle-map__train-icon",
  })
}

const TrainVehicle = ({ trainVehicle }: { trainVehicle: TrainVehicle }) => {
  const position: LatLngExpression = [
    trainVehicle.latitude,
    trainVehicle.longitude,
  ]
  const icon: Leaflet.DivIcon = makeTrainVehicleIcon(trainVehicle)
  return <Marker position={position} icon={icon} />
}

export const strokeOptions = ({ color }: Shape): object =>
  color
    ? {
        color,
        opacity: 1.0,
        weight: 4,
      }
    : {
        color: "#4db6ac",
        opacity: 0.6,
        weight: 6,
      }

const Shape = ({ shape }: { shape: Shape }) => {
  const positions: LatLngExpression[] = shape.points.map((point) => [
    point.lat,
    point.lon,
  ])

  return (
    <>
      <Polyline
        className="m-vehicle-map__route-shape"
        positions={positions}
        {...strokeOptions(shape)}
      />
      {(shape.stops || []).map((stop) => (
        <CircleMarker
          key={stop.id}
          className="m-vehicle-map__stop"
          center={[stop.lat, stop.lon]}
          radius={3}
        />
      ))}
    </>
  )
}

export const autoCenter = (
  map: LeafletMap,
  latLngs: LatLngExpression[],
  pickerContainerIsVisible: boolean
): void => {
  if (latLngs.length === 0) {
    map.setView(defaultCenter, 13)
  } else if (latLngs.length === 1) {
    map.setView(latLngs[0], 16)
  } else if (latLngs.length > 1) {
    map.fitBounds(Leaflet.latLngBounds(latLngs), {
      paddingBottomRight: [20, 50],
      paddingTopLeft: [pickerContainerIsVisible ? 220 : 20, 20],
    })
  }
}

const RecenterControl = ({
  turnOnAutoCenter,
}: {
  turnOnAutoCenter: () => void
}) => (
  <Control position="topright">
    <div className="leaflet-bar m-vehicle-map__recenter-button">
      <a
        href="#"
        title="Recenter map"
        role="button"
        aria-label="Recenter map"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          turnOnAutoCenter()
        }}
      >
        <svg
          height="26"
          viewBox="-5 -5 32 32"
          width="26"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
            transform="rotate(60, 12, 12)"
          />
        </svg>
      </a>
    </div>
  </Control>
)

const useAutoCenter = (
  reactLeafletMapRef: MutableRefObject<ReactLeafletMap | null>,
  shouldAutoCenter: boolean,
  isAutoCentering: MutableRefObject<boolean>,
  latLngs: LatLngExpression[]
) => {
  const [appState] = useContext(StateDispatchContext)
  const pickerContainerIsVisible: boolean = appState.pickerContainerIsVisible
  useEffect(() => {
    const reactLeafletMap: ReactLeafletMap | null = reactLeafletMapRef.current
    if (reactLeafletMap !== null && shouldAutoCenter) {
      const leafletMap: LeafletMap = reactLeafletMap.leafletElement
      isAutoCentering.current = true
      autoCenter(leafletMap, latLngs, pickerContainerIsVisible)
    }
  }, [
    shouldAutoCenter,
    // useEffect uses ===, which doesn't work on arrays.
    // convert the array to a string so useEffect can tell if it doesn't change.
    JSON.stringify(latLngs),
    pickerContainerIsVisible,
  ])
}

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const mapRef: MutableRefObject<ReactLeafletMap | null> =
    // this prop is only for tests, and is consistent between renders, so the hook call is consistent
    // tslint:disable-next-line: react-hooks-nesting
    props.reactLeafletRef || useRef(null)
  const [shouldAutoCenter, setShouldAutoCenter] = useState<boolean>(true)
  const isAutoCentering: MutableRefObject<boolean> = useRef(false)

  const latLngs: LatLngExpression[] = props.vehicles.map(
    ({ latitude, longitude }) => Leaflet.latLng(latitude, longitude)
  )
  useAutoCenter(mapRef, shouldAutoCenter, isAutoCentering, latLngs)

  const autoCenteringClass = shouldAutoCenter
    ? "m-vehicle-map-state--auto-centering"
    : ""

  return (
    <>
      <div className={`m-vehicle-map-state ${autoCenteringClass}`} />
      <ReactLeafletMap
        className="m-vehicle-map"
        id="id-vehicle-map"
        ref={mapRef}
        maxBounds={[
          [41.2, -72],
          [43, -69.8],
        ]}
        zoomControl={false}
        center={defaultCenter}
        zoom={13}
        onmovestart={() => {
          // If the user drags or zooms, they want manual control of the map.
          // But don't disable shouldAutoCenter if the move was triggered by an auto center.
          if (!isAutoCentering.current) {
            setShouldAutoCenter(false)
          }
        }}
        onmoveend={() => {
          // Wait until the auto centering is finished to start listening for manual moves again.
          if (isAutoCentering.current) {
            isAutoCentering.current = false
          }
        }}
      >
        <ZoomControl position="topright" />
        <FullscreenControl position="topright" />
        <RecenterControl turnOnAutoCenter={() => setShouldAutoCenter(true)} />
        <TileLayer
          url="https://mbta-map-tiles-dev.s3.amazonaws.com/osm_tiles/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {props.vehicles.map((vehicle: Vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} isPrimary={true} />
        ))}
        {(props.secondaryVehicles || []).map((vehicle: Vehicle) => (
          <Vehicle key={vehicle.id} vehicle={vehicle} isPrimary={false} />
        ))}
        {(props.trainVehicles || []).map((trainVehicle: TrainVehicle) => (
          <TrainVehicle key={trainVehicle.id} trainVehicle={trainVehicle} />
        ))}
        {(props.shapes || []).map((shape) => (
          <Shape key={shape.id} shape={shape} />
        ))}
      </ReactLeafletMap>
    </>
  )
}

export default Map
