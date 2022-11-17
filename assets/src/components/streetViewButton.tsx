import React, { ReactElement } from "react"
import { streetViewUrl } from "../util/streetViewUrl"

const StreetViewButton = (position: {
  latitude: number
  longitude: number
  bearing?: number
}): ReactElement<HTMLElement> => {
  const url = streetViewUrl(position)

  return (
    <a type="button" href={url} target="_blank" rel="noreferrer">
      Go to Street View
    </a>
  )
}
export default StreetViewButton
