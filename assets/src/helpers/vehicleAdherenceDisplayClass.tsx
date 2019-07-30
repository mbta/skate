import featureIsEnabled from "../laboratoryFeatures"
import { VehicleAdherenceStatus } from "../models/vehicleStatus"
import { HeadwaySpacing } from "../realtime"

const vehicleAdherenceDisplayClass = (
  headwaySpacing: HeadwaySpacing,
  status: VehicleAdherenceStatus
): string =>
  !featureIsEnabled("headway_ladder_colors") ||
  headwaySpacing === null ||
  status === "off-course"
    ? status
    : ""

export default vehicleAdherenceDisplayClass
