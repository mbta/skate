import React, { useState } from "react"
import { useMap, useMapEvent } from "react-leaflet"
import { ReactMarker } from "../utilities/reactMarker"

interface UserLocationCircleProps {
  /**
   * Radius of accuracy area in pixels
   */
  radius: number
  /**
   * Heading from GeolocationCoordinates, in degrees
   */
  heading: number | null
}

interface UserLocationProps {
  /**
   * Accessible SVG name
   */
  title?: string
}

export const UserLocationCircle = ({
  radius,
  heading,
  title = "Your current location",
}: UserLocationCircleProps & UserLocationProps) => (
  <svg viewBox="-10 -10 20 20">
    {title && <title>{title}</title>}
    {heading !== null && (
      <defs>
        <linearGradient id="headingGradient" gradientTransform="rotate(90)">
          <stop offset="15%" stopColor="rgba(118, 203, 192, 0)" />
          <stop offset="90%" stopColor="#76cbc0" />
        </linearGradient>
      </defs>
    )}
    <circle
      cx={0}
      cy={0}
      r={`${radius || 0}px`}
      className="c-user-location-marker__accuracy-radius"
    />
    {heading !== null && (
      <polygon
        points="0,0 -15,-35 15,-35"
        fill="url('#headingGradient')"
        transform={`rotate(${heading}, 0, 0)`}
        className="c-user-location-marker__heading"
      />
    )}
    <circle
      cx={0}
      cy={0}
      r="10"
      className="c-user-location-marker__center-dot"
    />
  </svg>
)

interface UserLocationMarkerProps {
  location: GeolocationCoordinates
}

const pixelsPerMeterFromMap = (map: L.Map): number => {
  const mapWidth = map.getSize().x

  // from p1 to p2 forms a horizontal line segment vertically centerd in the map
  const y = map.getSize().y / 2
  const p1 = map.containerPointToLatLng([0, y])
  const p2 = map.containerPointToLatLng([mapWidth, y])

  return mapWidth / map.distance(p1, p2)
}

const UserLocationMarker = ({
  location,
  title,
}: UserLocationMarkerProps & UserLocationProps) => {
  const map = useMap()
  const [pixelsPerMeter, setPixelsPerMeter] = useState<number>(
    pixelsPerMeterFromMap(map)
  )

  useMapEvent("zoomend", () => {
    setPixelsPerMeter(pixelsPerMeterFromMap(map))
  })

  const radius = location.accuracy * pixelsPerMeter

  return (
    <ReactMarker
      position={[location.latitude, location.longitude]}
      divIconSettings={{
        iconSize: [20, 20],
        className: "c-user-location-marker",
      }}
      icon={
        <UserLocationCircle
          title={title}
          radius={radius}
          heading={location.heading}
        />
      }
    />
  )
}

export default UserLocationMarker
