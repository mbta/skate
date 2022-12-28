import React, { ReactElement } from "react"
import { WalkingIcon } from "../helpers/icon"
import { streetViewUrl } from "../util/streetViewUrl"

const StreetViewButton = (position: {
  latitude: number
  longitude: number
  bearing?: number
}): ReactElement<HTMLElement> => (
  <a
    className="m-street-view-button"
    href={streetViewUrl(position)}
    target="_blank"
    rel="noreferrer"
  >
    <WalkingIcon className="m-street-view-button__icon" />
    Go to Street View
  </a>
)

export default StreetViewButton
