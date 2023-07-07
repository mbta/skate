import { Factory } from "fishery"
import { LocationType } from "../../src/models/stopData"
import { Stop } from "../../src/schedule"

export default Factory.define<Stop>(({ sequence }) => ({
  id: `stop${sequence}`,
  name: `Some Stop - ${sequence}`,
  locationType: LocationType.Stop,
  lat: 0,
  lon: 0,
}))
