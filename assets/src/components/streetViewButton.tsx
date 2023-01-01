import React, { ReactElement } from "react"
import { WalkingIcon } from "../helpers/icon"
import { streetViewUrl } from "../util/streetViewUrl"

export interface WorldPositionBearing {
  latitude: number
  longitude: number
  bearing?: number
}

export interface StreetViewButtonProps extends WorldPositionBearing {
  className?: string
  text?: string
  title?: string
  children?: ReactElement
}

const StreetViewButton = ({
  className,
  text,
  children,
  title,
  ...worldPosition
}: StreetViewButtonProps): ReactElement<HTMLElement> => (
  <a
    className="m-street-view-button"
    href={streetViewUrl(worldPosition)}
    target="_blank"
    rel="noreferrer"
    {...(title && { title })}
  >
    <WalkingIcon
      className="m-street-view-button__icon"
      aria-label=""
      aria-hidden={true}
    />
    {children ?? text ?? "Street View"}
  </a>
)

export default StreetViewButton
