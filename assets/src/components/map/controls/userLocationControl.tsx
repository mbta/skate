import React from "react"
import { LocationCrosshairsIcon } from "../../../helpers/icon"
import { CustomControl } from "./customControl"

type UserButtonProps = {
  onClick?: () => void
  disabled?: boolean
  title?: string
}

export const UserLocationButton = (props: UserButtonProps) => (
  <a className="c-user-location-button" {...props}>
    <LocationCrosshairsIcon className="c-user-location-button__svg" />
  </a>
)

export const UserLocationControl = (props: UserButtonProps) => (
  <CustomControl
    className="leaflet-control leaflet-bar inherit-box"
    position="topright"
  >
    <UserLocationButton {...props} />
  </CustomControl>
)
