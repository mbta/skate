import { LatLngLiteral } from "leaflet"
import { shapePointToLatLngLiteral } from "./pointLiterals"

interface LatLng {
  lat: number
  lon: number
}

export const calculateGeographicCenter = (
  coordinates: LatLng[]
): LatLngLiteral | null => {
  if (coordinates.length === 0) {
    return null
  }

  let sumLat = 0
  let sumLon = 0

  coordinates.forEach((coord) => {
    sumLat += coord.lat
    sumLon += coord.lon
  })

  const centerLat = sumLat / coordinates.length
  const centerLon = sumLon / coordinates.length

  return shapePointToLatLngLiteral({ lat: centerLat, lon: centerLon })
}
