import { Factory } from "fishery"
import { LocationType } from "../../src/models/stopData"
import { Stop } from "../../src/schedule"

const stopFactory = Factory.define<Stop>(({ sequence }) => ({
  id: `stop${sequence}`,
  name: `Some Stop - ${sequence}`,
  locationType: LocationType.Stop,
  vehicleType: 3,
  lat: 0,
  lon: 0,
  routes: undefined,
}))

export default stopFactory
