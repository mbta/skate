import { Factory } from "fishery"
import { StopData } from "../../src/models/stopData"

export const stopDataFactory = Factory.define<StopData>(({ sequence }) => ({
  id: `stop${sequence}`,
  name: `Some Stop - ${sequence}`,
  location_type: "stop",
  lat: 0,
  lon: 0,
  routes: [],
}))
