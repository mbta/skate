import Leaflet, { LatLngExpression } from "leaflet"
import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import React, { useContext } from "react"
import { CircleMarker, Marker, Polyline, Popup, Tooltip } from "react-leaflet"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import vehicleLabelString from "../helpers/vehicleLabel"
import { drawnStatus, statusClasses } from "../models/vehicleStatus"
import { TrainVehicle, Vehicle, VehicleId } from "../realtime"
import { Shape, Stop, StopId } from "../schedule"
import { UserSettings } from "../userSettings"
import "leaflet.fullscreen"
import StreetViewButton from "./streetViewButton"

import garages, { Garage } from "../data/garages"
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import garageIcon from "../../static/images/icon-bus-garage.svg"
// @ts-ignore
import stationIcon from "../../static/images/icon-station.svg"
/*  eslint-enable @typescript-eslint/ban-ts-comment */
import inTestGroup, { MAP_BETA_GROUP_NAME } from "../userInTestGroup"
import { LocationType } from "../models/stopData"

const makeVehicleIcon = (
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

const makeLabelIcon = (
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

export const VehicleMarker = ({
  vehicle,
  isPrimary,
  onSelect,
}: {
  vehicle: Vehicle
  isPrimary: boolean
  onSelect?: (vehicle: Vehicle) => void
}) => {
  const [appState] = useContext(StateDispatchContext)
  const eventHandlers = onSelect ? { click: () => onSelect(vehicle) } : {}
  const position: LatLngExpression = [vehicle.latitude, vehicle.longitude]
  const vehicleIcon: Leaflet.DivIcon = makeVehicleIcon(
    vehicle,
    isPrimary,
    appState.userSettings
  )
  const labelIcon: Leaflet.DivIcon = makeLabelIcon(
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
        eventHandlers={eventHandlers}
        zIndexOffset={zIndexOffset}
      />
      <Marker
        position={position}
        icon={labelIcon}
        eventHandlers={eventHandlers}
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

export const TrainVehicleMarker = ({
  trainVehicle,
}: {
  trainVehicle: TrainVehicle
}) => {
  const position: LatLngExpression = [
    trainVehicle.latitude,
    trainVehicle.longitude,
  ]
  const icon: Leaflet.DivIcon = makeTrainVehicleIcon(trainVehicle)
  return <Marker position={position} icon={icon} />
}

export const shapeStrokeOptions = ({ color }: Shape): object =>
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

const StopMarker = React.memo(({ stop }: { stop: Stop }) => (
  <CircleMarker
    className="m-vehicle-map__stop"
    center={[stop.lat, stop.lon]}
    radius={3}
  >
    <Popup className="m-vehicle-map__stop-tooltip">
      {stop.name}
      {inTestGroup(MAP_BETA_GROUP_NAME) && (
        <StreetViewButton
          latitude={stop.lat}
          longitude={stop.lon}
        ></StreetViewButton>
      )}
    </Popup>
  </CircleMarker>
))

const stationLeafletIcon = ({ size }: { size: number }): Leaflet.DivIcon => {
  return Leaflet.divIcon({
    html: stationIcon,
    className: "m-station-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export const StationMarker = React.memo(
  ({ station, iconSize }: { station: Stop; iconSize: StationIconSize }) => {
    const iconSizeLength = iconSize === StationIconSize.small ? 12 : 16

    return (
      <Marker
        position={[station.lat, station.lon]}
        icon={stationLeafletIcon({ size: iconSizeLength })}
      >
        <Tooltip
          className="m-vehicle-map__station-tooltip"
          direction={"top"}
          offset={[0, -(iconSizeLength / 2 + 8)]}
        >
          {station.name}
        </Tooltip>
      </Marker>
    )
  }
)

export enum StationIconSize {
  small,
  large,
}

export const RouteStopMarkers = ({
  stops,
  iconSize,
}: {
  stops: Stop[]
  iconSize: StationIconSize
}): JSX.Element => {
  const seenStopIds = new Set<StopId>()
  // Keep the first occurance of each stop when there are duplicates
  const uniqueStops: Stop[] = stops.flatMap((stop) => {
    if (!seenStopIds.has(stop.id)) {
      seenStopIds.add(stop.id)
      return [stop]
    }
    return []
  })

  return (
    <>
      {uniqueStops.map((stop) =>
        stop.locationType === LocationType.Station ? (
          <StationMarker station={stop} iconSize={iconSize} key={stop.id} />
        ) : (
          <StopMarker stop={stop} key={stop.id} />
        )
      )}
    </>
  )
}

export const RouteShape = React.memo(({ shape }: { shape: Shape }) => {
  const positions: LatLngExpression[] = shape.points.map((point) => [
    point.lat,
    point.lon,
  ])
  return (
    <Polyline
      className="m-vehicle-map__route-shape"
      positions={positions}
      {...shapeStrokeOptions(shape)}
    />
  )
})

const garageLeafletIcon = Leaflet.divIcon({
  html: garageIcon,
  className: "m-garage-icon",
  iconAnchor: new Leaflet.Point(10, 25),
})

const Garage = ({
  garage,
  zoomLevel,
}: {
  garage: Garage
  zoomLevel: number
}) => {
  const showLabel = zoomLevel >= 16
  return (
    <>
      <Marker
        interactive={false}
        key={garage.name}
        position={[garage.lat, garage.lon]}
        icon={garageLeafletIcon}
      />
      {showLabel && (
        <Marker
          interactive={false}
          position={[garage.lat, garage.lon]}
          icon={Leaflet.divIcon({
            iconAnchor: new Leaflet.Point(-14, 25),
            className: "m-garage-icon__label",
            html: `<svg height="30" width="200">
				    <text y=15>${garage.name}</text>
				</svg>`,
          })}
        />
      )}
    </>
  )
}

export const GarageMarkers = ({ zoomLevel }: { zoomLevel: number }) => (
  <>
    {garages.map((garage) => (
      <Garage key={garage.name} garage={garage} zoomLevel={zoomLevel} />
    ))}
  </>
)
