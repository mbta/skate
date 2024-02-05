import React from "react"
import { DropdownItem } from "../map/dropdown"
import { Route, RouteId, RoutePattern, Shape } from "../../schedule"
import { Vehicle } from "../../realtime"

export interface StartDetourProps {
  routeName: string
  routeDescription: string
  routeOrigin: string
  routeDirection: string
  shape: Shape
}

export interface DetourDropdownItemProps {
  setShouldShowPopup: (newValue: boolean) => void
  routePatternForVehicle: RoutePattern | null
  routeId: RouteId | undefined
  route: Route | null
  onStartDetour?: (props: StartDetourProps) => void
  selectedVehicleOrGhost: Vehicle
}

export const DetourDropdownItem = ({
  setShouldShowPopup,
  routePatternForVehicle,
  routeId,
  route,
  onStartDetour,
  selectedVehicleOrGhost,
}: DetourDropdownItemProps) => {
  return (
    <DropdownItem
      onClick={() => {
        setShouldShowPopup(false)

        const directionName =
          routePatternForVehicle?.directionId != undefined &&
          route?.directionNames[routePatternForVehicle?.directionId]

        onStartDetour &&
          routeId &&
          routePatternForVehicle?.shape &&
          routePatternForVehicle.headsign &&
          routePatternForVehicle.name &&
          directionName &&
          onStartDetour({
            routeName: routeId,
            routeDescription: routePatternForVehicle.headsign,
            routeOrigin: routePatternForVehicle.name,
            routeDirection: directionName,
            shape: routePatternForVehicle.shape,
          })
      }}
    >
      Start a detour on route {selectedVehicleOrGhost.routeId}
    </DropdownItem>
  )
}
