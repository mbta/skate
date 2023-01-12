import { Factory } from "fishery"
import { defaultCenter } from "../../src/components/map"
import { GeographicCoordinate } from "../../src/components/streetViewButton"

interface GeographicCoordinateParams {
  start: GeographicCoordinate
  step: GeographicCoordinate
}

// ~3in in geo space
const dist3Inches = 0.00001
const geoCoordinateFactory = Factory.define<
  GeographicCoordinate,
  GeographicCoordinateParams
>(({ sequence, transientParams: { start, step } }) => ({
  latitude: sequence * (step?.latitude ?? dist3Inches) + (start?.latitude ?? 0),
  longitude:
    sequence * (step?.longitude ?? dist3Inches) + (start?.longitude ?? 0),
}))

export const localGeoCoordinateFactory = geoCoordinateFactory.transient({
  start: { latitude: defaultCenter.lat, longitude: defaultCenter.lng },
})
