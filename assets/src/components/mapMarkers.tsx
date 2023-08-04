import Leaflet, { LatLngExpression } from "leaflet"
import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import "leaflet.fullscreen"
import React, { useContext } from "react"
import { Marker, Polyline, Popup, Tooltip } from "react-leaflet"

import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import vehicleLabelString from "../helpers/vehicleLabel"
import { drawnStatus, statusClasses } from "../models/vehicleStatus"
import { TrainVehicle, Vehicle } from "../realtime"
import { DirectionId, Shape, Stop, StopId } from "../schedule"
import { UserSettings } from "../userSettings"

import garages, { Garage } from "../data/garages"
import useDeviceSupportsHover from "../hooks/useDeviceSupportsHover"
import { LocationType } from "../models/stopData"

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import garageIcon from "../../static/images/icon-bus-garage.svg"
// @ts-ignore
import stationIcon from "../../static/images/icon-station.svg"
// @ts-ignore
import locationDotIcon from "../../static/images/icon-location-dot.svg"
import { StopMarkerWithInfo } from "./map/markers/stopMarker"
import StreetViewModeEnabledContext from "../contexts/streetViewModeEnabledContext"
import { streetViewUrl } from "../util/streetViewUrl"
import { TileTypeContext } from "../contexts/tileTypeContext"
import { ReactMarker } from "./map/utilities/reactMarker"
import { LocationSearchResult } from "../models/locationSearchResult"

/*  eslint-enable @typescript-eslint/ban-ts-comment */

const makeVehicleIcon = (
  vehicle: Vehicle,
  isPrimary: boolean,
  userSettings: UserSettings,
  isSelected: boolean
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
          class="${joinClasses([
            ...statusClasses(
              drawnStatus(vehicle),
              userSettings.vehicleAdherenceColors
            ),
            isSelected ? "selected" : null,
          ])}"
          d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
          transform="scale(${isPrimary ? 1.0 : 0.8}) rotate(${
      vehicle.bearing || 0
    }) translate(${-centerX}, ${-centerY})"
        />
      </svg>`,
    iconAnchor: [0, 0],
    className: "c-vehicle-map__icon",
  })
}

const makeLabelIcon = (
  vehicle: Vehicle,
  isPrimary: boolean,
  settings: UserSettings,
  isSelected: boolean
): Leaflet.DivIcon => {
  const labelString = vehicleLabelString(vehicle, settings)
  const labelBackgroundHeight = isPrimary ? 16 : 12
  const labelBackgroundWidth =
    labelString.length <= 4 ? (isPrimary ? 40 : 30) : isPrimary ? 62 : 40
  const selectedClass = isSelected ? "selected" : null
  return Leaflet.divIcon({
    className: joinClasses([
      "c-vehicle-map__label",
      isPrimary ? "primary" : "secondary",
      selectedClass,
    ]),
    html: `<svg viewBox="0 0 ${labelBackgroundWidth} ${labelBackgroundHeight}" width="${labelBackgroundWidth}" height="${labelBackgroundHeight}">
            <rect
                class="c-vehicle-icon__label-background"
                width="100%" height="100%"
                rx="5.5px" ry="5.5px"
              />
            <text class="c-vehicle-icon__label" x="50%" y="50%" text-anchor="middle" dominant-baseline="central">
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
  isSelected = false,
}: {
  vehicle: Vehicle
  isPrimary: boolean
  isSelected?: boolean
  onSelect?: (vehicle: Vehicle) => void
}) => {
  const [{ userSettings }] = useContext(StateDispatchContext)
  const eventHandlers = onSelect ? { click: () => onSelect(vehicle) } : {}
  const position: LatLngExpression = [vehicle.latitude, vehicle.longitude]
  const vehicleIcon: Leaflet.DivIcon = makeVehicleIcon(
    vehicle,
    isPrimary,
    userSettings,
    isSelected
  )
  const labelIcon: Leaflet.DivIcon = makeLabelIcon(
    vehicle,
    isPrimary,
    userSettings,
    isSelected
  )

  // https://leafletjs.com/reference.html#marker-zindexoffset
  // > By default, marker images zIndex is set automatically based on its latitude
  // > [...] if you want to put the marker on top of all others,
  // > [specify] a high value like 1000 [...]
  const zIndexOffset = isSelected ? 1000 : 0
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
    className: "c-vehicle-map__train-icon",
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

const stationLeafletIcon = ({ size }: { size: number }): Leaflet.DivIcon => {
  return Leaflet.divIcon({
    html: stationIcon,
    className: "c-station-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/* Returns a popup and a tooltip for the given content.
For devices that support hover, only the tooltip will be visible.
On devices that don't support hover, the popup will be visble on-click.
*/
export const MobileFriendlyTooltip = ({
  children,
  markerRadius,
  className,
}: {
  children: JSX.Element | string
  markerRadius: number
  className: string
}) => {
  const supportsHover = useDeviceSupportsHover()

  const fullClassName = `c-vehicle-map__mobile-friendly-tooltip ${className}`

  return supportsHover ? (
    <Tooltip
      pane="tooltipPane"
      className={fullClassName}
      direction={"top"}
      offset={[0, -(markerRadius + 8)]}
    >
      {children}
    </Tooltip>
  ) : (
    <Popup
      pane="popupPane"
      autoPan={false}
      // style popup as tooltip for consistency
      className={`leaflet-tooltip ${fullClassName} leaflet-tooltip-top`}
      closeButton={false}
      offset={[0, -(markerRadius + 8)]}
    >
      {children}
    </Popup>
  )
}

enum StationIconSize {
  small,
  large,
}

export const StationMarker = React.memo(
  ({ station, zoomLevel }: { station: Stop; zoomLevel: number }) => {
    const iconSize =
      zoomLevel <= 16 ? StationIconSize.small : StationIconSize.large
    const iconSizeLength = iconSize === StationIconSize.small ? 12 : 16

    const fireEvent = () => {
      window.FS?.event("Station tooltip shown")
    }

    return (
      <Marker
        position={[station.lat, station.lon]}
        icon={stationLeafletIcon({ size: iconSizeLength })}
        eventHandlers={{
          tooltipopen: fireEvent,
          popupopen: fireEvent,
        }}
      >
        <MobileFriendlyTooltip
          className={"c-vehicle-map__stop-tooltip"}
          markerRadius={iconSizeLength / 2}
        >
          {station.name}
        </MobileFriendlyTooltip>
      </Marker>
    )
  }
)

export const RouteStopMarkers = ({
  stops,
  zoomLevel,
  direction,
  includeStopCard,
}: {
  stops: Stop[]
  zoomLevel: number
  direction?: DirectionId
  includeStopCard?: boolean
}): JSX.Element => {
  const seenStopIds = new Set<StopId>()
  // Keep the first occurrence of each stop when there are duplicates
  const uniqueStops: Stop[] = stops.flatMap((stop) => {
    if (!seenStopIds.has(stop.id)) {
      seenStopIds.add(stop.id)
      return [stop]
    }
    return []
  })

  const streetViewActive = useContext(StreetViewModeEnabledContext)

  return (
    <>
      {uniqueStops.map((stop) =>
        stop.locationType === LocationType.Station ? (
          <StationMarker key={stop.id} station={stop} zoomLevel={zoomLevel} />
        ) : (
          <StopMarkerWithInfo
            key={stop.id}
            stop={stop}
            direction={direction}
            includeStopCard={includeStopCard && !streetViewActive}
            zoomLevel={zoomLevel}
            interactionStatesDisabled={streetViewActive}
            eventHandlers={
              streetViewActive
                ? {
                    click: () => {
                      const url = streetViewUrl({
                        latitude: stop.lat,
                        longitude: stop.lon,
                      })
                      window.FS?.event(
                        "User clicked map bus stop to open street view",
                        {
                          streetViewUrl_str: url,
                          clickedMapAt: {
                            latitude_real: stop.lat,
                            longitude_real: stop.lon,
                          },
                        }
                      )
                      window.open(url, "_blank")
                    },
                  }
                : {}
            }
          />
        )
      )}
    </>
  )
}

export const RouteShape = React.memo(
  ({
    shape,
    isSelected,
    children,
  }: {
    shape: Shape
    isSelected?: boolean
    children?: JSX.Element
  }) => {
    const positions: LatLngExpression[] = shape.points.map((point) => [
      point.lat,
      point.lon,
    ])

    const tileType = useContext(TileTypeContext)

    return (
      <Polyline
        // workaround to className not being mutable - inclue tileType in key to force rerender when tileType changes
        key={shape.id + tileType}
        className={joinClasses([
          "c-vehicle-map__route-shape",
          isSelected && "c-vehicle-map__route-shape--selected",
          shape.className,
          `c-vehicle-map__route-shape--${tileType}`,
        ])}
        positions={positions}
        interactive={false}
      >
        {children}
      </Polyline>
    )
  }
)

const garageLeafletIcon = Leaflet.divIcon({
  html: garageIcon,
  className: "c-garage-icon",
  iconAnchor: new Leaflet.Point(10, 25),
  iconSize: [21, 25],
})

const Garage = ({
  garage,
  zoomLevel,
}: {
  garage: Garage
  zoomLevel: number
}) => {
  const showLabel = zoomLevel >= 16
  const tileType = useContext(TileTypeContext)

  return (
    <>
      <Marker
        interactive={false}
        key={garage.name}
        position={[garage.lat, garage.lon]}
        icon={garageLeafletIcon}
      />
      {showLabel && (
        <ReactMarker
          interactive={false}
          position={[garage.lat, garage.lon]}
          divIconSettings={{
            iconAnchor: new Leaflet.Point(-14, 25),
            className: `c-garage-icon__label c-garage-icon__label--${tileType}`,
          }}
          icon={
            <svg height="30" width="200">
              <text y="15" x="1">
                {garage.name}
              </text>
            </svg>
          }
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

const locationLeafletIcon = (selected?: boolean): Leaflet.DivIcon =>
  Leaflet.divIcon({
    html: locationDotIcon,
    className:
      "c-location-dot-icon" +
      (selected ? " c-location-dot-icon--selected" : ""),
    iconAnchor: new Leaflet.Point(9, 24),
    iconSize: [24, 18],
  })

export const LocationMarker = ({
  location,
  selected,
}: {
  location: LocationSearchResult
  selected?: boolean
}) => (
  <Marker
    position={[location.latitude, location.longitude]}
    icon={locationLeafletIcon(selected)}
  />
)
