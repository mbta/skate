import { Factory } from "fishery"
import { Shape } from "../../src/schedule"

export default Factory.define<Shape>(({ sequence }) => ({
  id: `shape${sequence}`,
  points: [{ shape_id: `shape${sequence}`, sequence: 1, lat: 0, lon: 0 }],
}))
