import Leaflet, { LatLngExpression } from "leaflet"
import "leaflet-defaulticon-compatibility" // see https://github.com/Leaflet/Leaflet/issues/4968#issuecomment-483402699
import "leaflet.fullscreen"
import React, { useContext } from "react"
import { Marker, Polyline, Popup, Tooltip } from "react-leaflet"

import { joinClasses } from "../helpers/dom"
import { TrainVehicle } from "../realtime"
import { Shape, Stop } from "../schedule"

import garages, { Garage as GarageData } from "../data/garages"
import useDeviceSupportsHover from "../hooks/useDeviceSupportsHover"
import { LocationType } from "../models/stopData"

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import garageIcon from "../../static/images/icon-bus-garage.svg"
// @ts-ignore
import stationIcon from "../../static/images/icon-station.svg"
// @ts-ignore
import { StopMarkerWithInfo } from "./map/markers/stopMarker"
import StreetViewModeEnabledContext from "../contexts/streetViewModeEnabledContext"
import { streetViewUrl } from "../util/streetViewUrl"
import { TileTypeContext } from "../contexts/tileTypeContext"
import { ReactMarker } from "./map/utilities/reactMarker"
import { fullStoryEvent } from "../helpers/fullStory"

/*  eslint-enable @typescript-eslint/ban-ts-comment */

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
      fullStoryEvent("Station tooltip shown", {})
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

/**
 * @returns a list of stops at unique locations. Where a platform stop is at the exact location of a station, the list will include the station.
 */
const uniqueStopsByLocation = (stops: Stop[]) => {
  const locationToStop: Record<string, Stop> = {}
  stops.forEach((stop) => {
    const key = `${stop.lat}_${stop.lon}`
    const existingStopAtLocation = locationToStop[key]
    if (
      existingStopAtLocation === undefined ||
      stop.locationType === LocationType.Station
    ) {
      locationToStop[key] = stop
    }
  })
  return Object.values(locationToStop)
}

export const StopMarkers = ({
  stops,
  zoomLevel,
  includeStopCard,
  zoomLevelConfig = {},
}: {
  stops: Stop[]
  zoomLevel: number
  includeStopCard?: boolean
  zoomLevelConfig?: {
    minStopZoom?: number
    minStationZoom?: number
  }
}): JSX.Element => {
  const { minStopZoom = 17, minStationZoom = 15 } = zoomLevelConfig

  const uniqueStops: Stop[] = uniqueStopsByLocation(stops)
  const streetViewActive = useContext(StreetViewModeEnabledContext)

  return (
    <>
      {uniqueStops.map((stop) => {
        switch (stop.locationType) {
          case LocationType.Station: {
            return (
              zoomLevel >= minStationZoom && (
                <StationMarker
                  key={stop.id}
                  station={stop}
                  zoomLevel={zoomLevel}
                />
              )
            )
          }
          default: {
            return (
              zoomLevel >= minStopZoom && (
                <StopMarkerWithInfo
                  key={stop.id}
                  stop={stop}
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
                            fullStoryEvent(
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
            )
          }
        }
      })}
    </>
  )
}

export const RouteStopMarkers = (props: {
  stops: Stop[]
  zoomLevel: number
  includeStopCard?: boolean
}): JSX.Element => {
  return (
    <StopMarkers
      {...props}
      zoomLevelConfig={{ minStopZoom: 0, minStationZoom: 0 }}
    />
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
  garage: GarageData
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
