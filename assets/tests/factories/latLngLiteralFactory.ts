import { Factory } from "fishery"
import { localGeoCoordinateFactory } from "./geoCoordinate"
import { LatLngLiteral } from "leaflet"

/**
 * Wrapper around {@link localGeoCoordinateFactory}
 */
export const latLngLiteralFactory = Factory.define<LatLngLiteral>(() => {
  const { latitude, longitude } = localGeoCoordinateFactory.build()
  return { lat: latitude, lng: longitude }
})
