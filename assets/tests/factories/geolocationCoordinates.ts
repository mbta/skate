import { Factory } from "fishery"

export default Factory.define<GeolocationCoordinates>(() => ({
  latitude: 42.35933,
  longitude: -71.059592,
  accuracy: 100,
  heading: 0,
  altitude: 0,
  altitudeAccuracy: 0,
  speed: 0,
}))
