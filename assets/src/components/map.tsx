import Leaflet, {
  Control,
  ControlOptions,
  DomUtil,
  LatLng,
  LatLngExpression,
  Map as LeafletMap,
} from "leaflet"
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
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import FullscreenControl from "react-leaflet-fullscreen"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import vehicleLabelString from "../helpers/vehicleLabel"
import { drawnStatus, statusClasses } from "../models/vehicleStatus"
import { TrainVehicle, Vehicle, VehicleId } from "../realtime.d"
import { Shape } from "../schedule"
import { selectVehicle } from "../state"
import { UserSettings } from "../userSettings"
import { equalByElements } from "../helpers/array"
import appData from "../appData"
import { createControlComponent } from "@react-leaflet/core"

export interface Props {
  vehicles: Vehicle[]
  shapes?: Shape[]
  // secondaryVehicles are smaller, deemphasized, and don't affect autocentering
  secondaryVehicles?: Vehicle[]
  // trainVehicles are white, don't get a label, and don't affect autocentering
  trainVehicles?: TrainVehicle[]
  reactLeafletRef?: MutableRefObject<LeafletMap | null>
}

interface RecenterControlProps extends ControlOptions {
  recenter: () => void
}

export const defaultCenter: LatLngExpression = {
  lat: 42.360718,
  lng: -71.05891,
}

const makeLeafletVehicleIcon = (
  vehicle: Vehicle,
  isPrimary: boolean,
  userSettings: UserSettings
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
          class="${className(
            statusClasses(
              drawnStatus(vehicle),
              userSettings.vehicleAdherenceColors
            )
          )}"
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

const makeLeafletLabelIcon = (
  vehicle: Vehicle,
  isPrimary: boolean,
  settings: UserSettings,
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

const LeafletVehicle = ({
  vehicle,
  isPrimary,
}: {
  vehicle: Vehicle
  isPrimary: boolean
}) => {
  const [appState, dispatch] = useContext(StateDispatchContext)
  const select = isPrimary
    ? () => dispatch(selectVehicle(vehicle))
    : // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {}
  const position: LatLngExpression = [vehicle.latitude, vehicle.longitude]
  const vehicleIcon: Leaflet.DivIcon = makeLeafletVehicleIcon(
    vehicle,
    isPrimary,
    appState.userSettings
  )
  const labelIcon: Leaflet.DivIcon = makeLeafletLabelIcon(
    vehicle,
    isPrimary,
    appState.userSettings,
    appState.selectedVehicleOrGhost?.id || ""
  )
  const zIndexOffset = isPrimary ? 2000 : 0
  return (
    <>
      <Marker
        position={position}
        icon={vehicleIcon}
        eventHandlers={{
          click: select,
        }}
        zIndexOffset={zIndexOffset}
      />
      <Marker
        position={position}
        icon={labelIcon}
        eventHandlers={{
          click: select,
        }}
        zIndexOffset={zIndexOffset}
      />
    </>
  )
}

const makeLeafletTrainVehicleIcon = ({
  bearing,
}: TrainVehicle): Leaflet.DivIcon => {
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

const LeafletTrainVehicle = ({
  trainVehicle,
}: {
  trainVehicle: TrainVehicle
}) => {
  const position: LatLngExpression = [
    trainVehicle.latitude,
    trainVehicle.longitude,
  ]
  const icon: Leaflet.DivIcon = makeLeafletTrainVehicleIcon(trainVehicle)
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

const LeafletShape = ({ shape }: { shape: Shape }) => {
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

class RecenterControl extends Control {
  private recenter: () => void
  constructor(props: ControlOptions, recenter: () => void) {
    super(props)
    this.recenter = recenter
  }

  onAdd() {
    const img = DomUtil.create(
      "button",
      "leaflet-bar m-vehicle-map__recenter-button"
    )
    img.title = "Recenter map"
    img.ariaLabel = "Recenter map"
    img.onclick = (e) => {
      e.stopPropagation()
      e.preventDefault()
      this.recenter()
    }
    img.innerHTML = `
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
          </svg>`
    return img
  }
}

export const RecenterControlButton = createControlComponent(
  ({ position: position, recenter: recenterFn }: RecenterControlProps) =>
    new RecenterControl({ position: position }, recenterFn)
)

const tilesetUrl = (): string => appData()?.tilesetUrl || ""

const EventAdder = ({
  isAutoCentering,
  setShouldAutoCenter,
}: {
  isAutoCentering: MutableRefObject<boolean>
  setShouldAutoCenter: (arg0: boolean) => void
}): ReactElement => {
  useMapEvents({
    movestart: () => {
      // If the user drags or zooms, they want manual control of the map.
      // But don't disable shouldAutoCenter if the move was triggered by an auto center.
      if (!isAutoCentering.current) {
        setShouldAutoCenter(false)
      }
    },
    moveend: () => {
      // Wait until the auto centering is finished to start listening for manual moves again.
      if (isAutoCentering.current) {
        isAutoCentering.current = false
      }
    },
  })
  return <></>
}

const Autocenterer = ({
  latLngs,
  shouldAutoCenter,
  isAutoCentering,
}: {
  shouldAutoCenter: boolean
  isAutoCentering: MutableRefObject<boolean>
  latLngs: LatLng[]
}) => {
  const map = useMap()

  const [{ pickerContainerIsVisible }] = useContext(StateDispatchContext)
  const [currentLatLngs, setCurrentLatLngs] = useState<LatLng[]>(latLngs)

  if (
    !equalByElements(latLngs, currentLatLngs, (latLng1, latLng2) =>
      latLng1.equals(latLng2)
    )
  ) {
    setCurrentLatLngs(latLngs)
  }

  useEffect(() => {
    if (map !== null && shouldAutoCenter) {
      isAutoCentering.current = true
      autoCenter(map, currentLatLngs, pickerContainerIsVisible)
    }
  }, [
    map,
    shouldAutoCenter,
    isAutoCentering,
    currentLatLngs,
    pickerContainerIsVisible,
  ])

  return <></>
}

const Map = (props: Props): ReactElement<HTMLDivElement> => {
  const mapRef: MutableRefObject<LeafletMap | null> =
    // this prop is only for tests, and is consistent between renders, so the hook call is consistent
    // eslint-disable-next-line react-hooks/rules-of-hooks
    props.reactLeafletRef || useRef(null)
  const [shouldAutoCenter, setShouldAutoCenter] = useState<boolean>(true)
  const isAutoCentering: MutableRefObject<boolean> = useRef(false)

  const latLngs: LatLng[] = props.vehicles.map(({ latitude, longitude }) =>
    Leaflet.latLng(latitude, longitude)
  )

  const autoCenteringClass = shouldAutoCenter
    ? "m-vehicle-map-state--auto-centering"
    : ""

  return (
    <>
      <div className={`m-vehicle-map-state ${autoCenteringClass}`} />
      <MapContainer
        className="m-vehicle-map"
        id="id-vehicle-map"
        maxBounds={[
          [41.2, -72],
          [43, -69.8],
        ]}
        zoomControl={false}
        center={defaultCenter}
        zoom={13}
        // workaround for ref unsupported in react-leaflet v3.
        // can be replaced with directly passing ref in v4.
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance
        }}
      >
        <EventAdder
          isAutoCentering={isAutoCentering}
          setShouldAutoCenter={setShouldAutoCenter}
        />
        <Autocenterer
          shouldAutoCenter={shouldAutoCenter}
          isAutoCentering={isAutoCentering}
          latLngs={latLngs}
        />
        <ZoomControl position="topright" />
        <FullscreenControl position="topright" />
        <RecenterControlButton
          position="topright"
          recenter={() => setShouldAutoCenter(true)}
        />

        <TileLayer
          url={`${tilesetUrl()}/{z}/{x}/{y}.png`}
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {props.vehicles.map((vehicle: Vehicle) => (
          <LeafletVehicle key={vehicle.id} vehicle={vehicle} isPrimary={true} />
        ))}
        {(props.secondaryVehicles || []).map((vehicle: Vehicle) => (
          <LeafletVehicle
            key={vehicle.id}
            vehicle={vehicle}
            isPrimary={false}
          />
        ))}
        {(props.trainVehicles || []).map((trainVehicle: TrainVehicle) => (
          <LeafletTrainVehicle
            key={trainVehicle.id}
            trainVehicle={trainVehicle}
          />
        ))}
        {(props.shapes || []).map((shape) => (
          <LeafletShape key={shape.id} shape={shape} />
        ))}
      </MapContainer>
    </>
  )
}

export default Map
