import React, { useState } from "react"
import { useMap, useMapEvent } from "react-leaflet"
import { ReactMarker } from "../utilities/reactMarker"

interface UserLocationCircleProps {
  radius: number
}

const UserLocationCircle = ({ radius }: UserLocationCircleProps) => (
  <svg viewBox="-10 -10 20 20">
    <circle
      cx={0}
      cy={0}
      r="10"
      className="c-user-location-marker__center-dot"
    />
    <circle
      cx={0}
      cy={0}
      r={`${radius || 0}px`}
      className="c-user-location-marker__accuracy-radius"
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

const UserLocationMarker = ({ location }: UserLocationMarkerProps) => {
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
      icon={<UserLocationCircle radius={radius} />}
    />
  )
}

export default UserLocationMarker
