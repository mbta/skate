import { LatLngLiteral } from "leaflet"
import { ShapePoint } from "../schedule"

export const latLngLiteralToShapePoint = (
  latLngLiteral: LatLngLiteral
): ShapePoint => {
  const { lat, lng } = latLngLiteral
  return { lat, lon: lng }
}

export const shapePointToLatLngLiteral = (
  shapePoint: ShapePoint
): LatLngLiteral => {
  const { lat, lon } = shapePoint
  return { lat, lng: lon }
}
