import { LatLngExpression, LeafletMouseEvent, Marker } from "leaflet"
import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import { StateDispatchContext } from "../../../contexts/stateDispatchContext"
import { joinClasses } from "../../../helpers/dom"
import { vehicleLabel } from "../../../helpers/vehicleLabel"
import {
  shuttleVariantFromRunId,
  ShuttleVariant,
} from "../../../models/shuttle"
import { drawnStatus, statusClasses } from "../../../models/vehicleStatus"
import { Vehicle } from "../../../realtime"
import { ReactMarker } from "../utilities/reactMarker"

interface VehicleMarkerProps extends PropsWithChildren {
  vehicle: Vehicle
  isPrimary: boolean
  isSelected?: boolean
  onSelect?: (vehicle: Vehicle) => void
  shouldShowPopup?: boolean
  onShouldShowPopupChange?: (newValue: boolean) => void
}

/**
 * If the supplied {@linkcode vehicle} is a shuttle, returns
 * classes to more specifically style shuttles matching certain conditions.
 * For example, specific styles depending on Rapid Transit Line the shuttle is
 * associated with.
 *
 * @param vehicle The vehicle to return styles for
 * @returns Array of classes to add to a vehicle marker
 */
const stylesForShuttle = (vehicle: Vehicle) => {
  // If this vehicle isn't a shuttle, return no styles
  if (vehicle.isShuttle === false) {
    return []
  }

  // Otherwise return a generic shuttle class and any more
  // specific styles for the shuttle.
  const classFor = (variant: string) => `c-vehicle-marker--${variant}`
  const shuttleClasses = ["c-vehicle-marker--shuttle"]
  switch (vehicle.runId && shuttleVariantFromRunId(vehicle.runId)) {
    case ShuttleVariant.Blue:
      return shuttleClasses.concat(classFor("blue"))
    case ShuttleVariant.CommuterRail:
      return shuttleClasses.concat(classFor("cr"))
    case ShuttleVariant.Green:
      return shuttleClasses.concat(classFor("green"))
    case ShuttleVariant.Orange:
      return shuttleClasses.concat(classFor("orange"))
    case ShuttleVariant.Red:
      return shuttleClasses.concat(classFor("red"))
    default:
      return shuttleClasses
  }
}

export const VehicleMarker = ({
  children,
  vehicle,
  isPrimary,
  onSelect,
  isSelected = false,
  shouldShowPopup = false,
  onShouldShowPopupChange = () => {},
}: VehicleMarkerProps) => {
  const [{ userSettings }] = useContext(StateDispatchContext)
  const markerRef = useRef<Marker<any>>(null)

  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)

  useEffect(() => {
    if (shouldShowPopup && !isPopupVisible) {
      markerRef.current?.openPopup()
    }

    if (!shouldShowPopup && isPopupVisible) {
      markerRef.current?.closePopup()
    }
  }, [shouldShowPopup, isPopupVisible])

  const eventHandlers = {
    click: (e: LeafletMouseEvent) => {
      e.originalEvent.stopImmediatePropagation()
      onSelect && onSelect(vehicle)
      onShouldShowPopupChange(false)
    },
    contextmenu: () => {
      onShouldShowPopupChange(true)
    },
    popupopen: () => {
      setIsPopupVisible(true)
    },
    popupclose: () => {
      setIsPopupVisible(false)
      onShouldShowPopupChange(false)
    },
  }
  const position: LatLngExpression = [vehicle.latitude, vehicle.longitude]
  const labelBackgroundHeight = isPrimary ? 16 : 12
  const labelBackgroundWidth =
    vehicleLabel(vehicle, userSettings).length <= 4
      ? isPrimary
        ? 40
        : 30
      : isPrimary
      ? 62
      : 40

  // https://leafletjs.com/reference.html#marker-zindexoffset
  // > By default, marker images zIndex is set automatically based on its latitude
  // > [...] if you want to put the marker on top of all others,
  // > [specify] a high value like 1000 [...]
  const zIndexOffset = isSelected ? 1000 : 0

  return (
    <>
      <ReactMarker
        position={position}
        eventHandlers={eventHandlers}
        zIndexOffset={zIndexOffset}
        ref={markerRef}
        divIconSettings={{
          iconAnchor: [0, 0],
          // Disable default leaflet marker class
          className: "",
        }}
        icon={
          <svg
            className={joinClasses([
              "c-vehicle-map__icon",
              ...stylesForShuttle(vehicle),
            ])}
            height="24"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className={joinClasses([
                ...statusClasses(
                  drawnStatus(vehicle),
                  userSettings.vehicleAdherenceColors
                ),
                isSelected ? "selected" : null,
              ])}
              d="m10 2.7-6.21 16.94a2.33 2.33 0 0 0 1.38 3 2.36 2.36 0 0 0 1.93-.14l4.9-2.67 4.89 2.71a2.34 2.34 0 0 0 3.34-2.8l-5.81-17a2.34 2.34 0 0 0 -4.4 0z"
              transform={
                `scale(${isPrimary ? 1.0 : 0.8}) ` +
                `rotate(${vehicle.bearing || 0}) ` +
                `translate(-12, -12)`
              }
            />
          </svg>
        }
      >
        {children}
      </ReactMarker>

      <ReactMarker
        position={position}
        divIconSettings={{
          iconAnchor: [labelBackgroundWidth / 2, isPrimary ? -16 : -10],
          // Disable default leaflet marker class
          className: "",
        }}
        icon={
          <svg
            className={joinClasses([
              "c-vehicle-map__label",
              isPrimary ? "primary" : "secondary",
              isSelected && "selected",
            ])}
            viewBox={`0 0 ${labelBackgroundWidth} ${labelBackgroundHeight}`}
            width={labelBackgroundWidth}
            height={labelBackgroundHeight}
          >
            <rect
              className="c-vehicle-icon__label-background"
              width="100%"
              height="100%"
              rx="5.5px"
              ry="5.5px"
            />
            <text
              className="c-vehicle-icon__label"
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {vehicleLabel(vehicle, userSettings)}
            </text>
          </svg>
        }
        eventHandlers={eventHandlers}
        zIndexOffset={zIndexOffset}
      />
    </>
  )
}
