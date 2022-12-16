import { Factory } from "fishery"
import { ShapeData } from "../../src/models/shapeData"

export default Factory.define<ShapeData>(({ sequence }) => ({
  id: `shape${sequence}`,
  points: [{ shape_id: `shape${sequence}`, sequence: 1, lat: 0, lon: 0 }],
}))
