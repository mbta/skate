import Leaflet, { LatLngLiteral } from "leaflet"
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

// calculates the point up to _buffer_ meters away from p1 in the direction of p2
export const closestWithBuffer = (
  p1: Leaflet.LatLng,
  p2: Leaflet.LatLng,
  buffer: number
) => {
  const d = p1.distanceTo(p2)
  const ratio = Math.min(1, buffer / d)
  const lat = p1.lat + (p2.lat - p1.lat) * ratio
  const lng = p1.lng + (p2.lng - p1.lng) * ratio
  return { lat, lng }
}
