import React from "react"
import { DropdownItem, DropdownMenu } from "../map/dropdown"
import { Route, RoutePattern } from "../../schedule"
import { Popup } from "react-leaflet"
import { PointTuple } from "leaflet"
import { LatLngLiteral } from "leaflet"
import { OriginalRoute } from "../../models/detour"

export interface DetourDropdownProps {
  routePatternForVehicle: RoutePattern | null
  route: Route | null
  onClick: (props: OriginalRoute) => void
  center: LatLngLiteral
  zoom: number
}

export const DetourDropdown = ({
  routePatternForVehicle,
  route,
  onClick,
  center,
  zoom,
}: DetourDropdownProps) => {
  // This offset is here because, due to a limitation of Leaflet
  // popups, we weren't able to render the popup at the bottom-right
  // corner of the marker, where it's supposed to go. This effectively
  // renders it centered and above the marker, and then uses the
  // offset to reposition it to the bottom-right corner.
  const dropdownOffset: PointTuple = [140, 97]

  if (!routePatternForVehicle || !route) {
    return null
  }

  const routeName = route.name

  const routeDescription = routePatternForVehicle.headsign

  const shape = routePatternForVehicle.shape

  if (!routeDescription || !shape) {
    return null
  }

  return (
    <Popup className="c-dropdown-popup-wrapper" offset={dropdownOffset}>
      <DropdownMenu>
        <DropdownItem
          onClick={() => {
            onClick({
              route,
              routePattern: routePatternForVehicle,
              center,
              zoom,
            })
          }}
        >
          Start a detour on route {routeName}
        </DropdownItem>
      </DropdownMenu>
    </Popup>
  )
}
