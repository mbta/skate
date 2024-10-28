import { Factory } from "fishery"
import { Crowding, OccupancyStatus } from "../../src/models/crowding"

const crowdingFactory = Factory.define<Crowding>(
  ({ transientParams: { capacity = 30, riders = 0 } }) => {
    let occupancyStatus: OccupancyStatus = "NO_DATA"
    if (riders === 0) {
      occupancyStatus = "EMPTY"
    } else if (riders > capacity) {
      occupancyStatus = "FULL"
    } else if (riders > capacity / 2) {
      occupancyStatus = "FEW_SEATS_AVAILABLE"
    } else if (riders < capacity / 2) {
      occupancyStatus = "MANY_SEATS_AVAILABLE"
    }
    return {
      capacity,
      load: riders,
      occupancyStatus,
      occupancyPercentage: riders / capacity,
    }
  }
)

export default crowdingFactory
