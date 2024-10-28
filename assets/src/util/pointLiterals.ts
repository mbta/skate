import { LatLngLiteral } from "leaflet"
import { ShapePoint } from "../schedule"

export const latLngLiteralToShapePoint = ({
  lat,
  lng,
}: LatLngLiteral): ShapePoint => ({ lat, lon: lng })

export const shapePointToLatLngLiteral = ({
  lat,
  lon,
}: ShapePoint): LatLngLiteral => ({ lat, lng: lon })
