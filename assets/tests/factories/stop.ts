import { Factory } from "fishery"
import { LocationType } from "../../src/models/stopData"
import { Stop } from "../../src/schedule"
import { localGeoCoordinateFactory } from "./geoCoordinate"

const stopFactory = Factory.define<Stop>(({ sequence }) => {
  const coord = localGeoCoordinateFactory.build()
  return {
    id: `stop${sequence}`,
    name: `Some Stop - ${sequence}`,
    locationType: LocationType.Stop,
    vehicleType: 3,
    lat: coord.latitude,
    lon: coord.longitude,
    routes: undefined,
  }
})

export default stopFactory
