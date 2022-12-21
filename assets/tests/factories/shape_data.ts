import { Factory } from "fishery"
import { ShapeData } from "../../src/models/shapeData"
import stopFactory from "./stop"

export default Factory.define<ShapeData>(({ sequence }) => ({
  id: `shape${sequence}`,
  points: [{ shape_id: `shape${sequence}`, sequence: 1, lat: 0, lon: 0 }],
  stops: [stopFactory.build({ id: `stop${sequence}` })],
}))
