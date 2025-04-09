import { Factory } from "fishery"
import { StopTime } from "../../src/minischedule"

export const StopTimeFactory = Factory.define<StopTime>(({ sequence }) => ({
  stopId: sequence.toString(),
  time: sequence * 2,
  timepointId: sequence % 3 === 0 ? `timepoint-${sequence}` : null,
}))
