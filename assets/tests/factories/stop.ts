import { Factory } from "fishery"
import { Stop } from "../../src/schedule"

export default Factory.define<Stop>(({ sequence }) => ({
  id: `stop${sequence}`,
  name: "Some Stop",
  lat: 0,
  lon: 0,
}))
