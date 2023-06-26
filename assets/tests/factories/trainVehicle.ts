import { Factory } from "fishery"
import { TrainVehicle } from "../../src/realtime"
import { defaultCenter } from "../../src/components/map"

export default Factory.define<TrainVehicle>(({ sequence }) => ({
  id: `t${sequence}`,
  latitude: defaultCenter.lat,
  longitude: defaultCenter.lng,
  bearing: 0,
}))
