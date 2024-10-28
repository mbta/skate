import React from "react"
import { DiamondTurnRightIcon } from "../helpers/icon"

const directionsUrl = (
  latitude: number,
  longitude: number
) => `https://www.google.com/maps/dir/?api=1\
&destination=${latitude.toString()},${longitude.toString()}\
&travelmode=driving`

export const DirectionsButton = ({
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
}) => (
  <a
    className="c-directions-button button-small"
    href={directionsUrl(latitude, longitude)}
    target="_blank"
    rel="noreferrer"
  >
    <DiamondTurnRightIcon />
    Get directions to bus
  </a>
)
