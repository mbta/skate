import React, { ReactElement } from "react"
import { WalkingIcon } from "../helpers/icon"
import { streetViewUrl } from "../util/streetViewUrl"

export interface WorldPositionBearing {
  latitude: number
  longitude: number
  bearing?: number
}

const StreetViewButton = ({
  text,
  children,
  title,
  ...position
}: {
  text?: string
  title?: string
  children?: ReactElement
} & WorldPositionBearing): ReactElement<HTMLElement> => (
  <a
    className="m-street-view-button"
    href={streetViewUrl(position)}
    target="_blank"
    rel="noreferrer"
    {...(title && { title })}
  >
    <WalkingIcon className="m-street-view-button__icon" />
    {children ?? text ?? "Street View"}
  </a>
)

export default StreetViewButton
