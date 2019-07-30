import featureIsEnabled from "../laboratoryFeatures"
import { HeadwaySpacing, VehicleAdherenceStatus } from "../models/vehicleStatus"

const vehicleAdherenceDisplayClass = (
  headwaySpacing: HeadwaySpacing | null,
  status: VehicleAdherenceStatus
): string =>
  !featureIsEnabled("headway_ladder_colors") ||
  headwaySpacing === null ||
  status === "off-course"
    ? status
    : ""

export default vehicleAdherenceDisplayClass
