import { Factory } from "fishery"
import { GeographicCoordinate } from "../../src/components/streetViewButton"

interface GeographicCoordinateParams {
  start: GeographicCoordinate
  step: GeographicCoordinate
}

const geoCoordinateFactory = Factory.define<
  GeographicCoordinate,
  GeographicCoordinateParams
>(({ sequence, transientParams: { start, step } }) => ({
  latitude: sequence * (step?.latitude ?? 0.0001) + (start?.latitude ?? 0),
  longitude: sequence * (step?.longitude ?? 0.0001) + (start?.longitude ?? 0),
}))

export const localGeoCoordinateFactory = geoCoordinateFactory.transient({
  start: { latitude: 42, longitude: -72 },
  step: { latitude: 1, longitude: 1 },
})
