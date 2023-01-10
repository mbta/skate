import React, { ReactElement } from "react"
import { className as classNames } from "../helpers/dom"
import { WalkingIcon } from "../helpers/icon"
import { streetViewUrl } from "../util/streetViewUrl"

export interface GeographicCoordinate {
  latitude: number
  longitude: number
}

export interface GeographicCoordinateBearing extends GeographicCoordinate {
  bearing?: number
}

export interface StreetViewButtonProps extends GeographicCoordinateBearing {
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
    className={classNames([
      "m-street-view-button",
      "button-dark-small",
      className,
    ])}
    href={streetViewUrl(worldPosition)}
    target="_blank"
    rel="noreferrer"
    {...(title && { title })}
  >
    <WalkingIcon
      className="m-street-view-button__icon"
      role="img"
      aria-label=""
      aria-hidden={true}
    />
    {children ?? text ?? "Street View"}
  </a>
)

export default StreetViewButton
