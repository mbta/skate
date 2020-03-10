import featureIsEnabled from "../laboratoryFeatures"
import { BlockWaiver, VehicleOrGhost } from "../realtime"
import { now } from "../util/dateTime"
import { isGhost } from "./vehicle"
import { AlertIconStyle } from "../components/iconAlertCircle"

export enum CurrentFuturePastType {
  Current = 1,
  Future,
  Past,
}

export const currentFuturePastType = ({
  startTime,
  endTime,
}: BlockWaiver): CurrentFuturePastType => {
  const nowDate: Date = now()

  if (startTime > nowDate) {
    return CurrentFuturePastType.Future
  } else if (endTime < nowDate) {
    return CurrentFuturePastType.Past
  } else {
    return CurrentFuturePastType.Current
  }
}

export const hasBlockWaiver = ({ blockWaivers }: VehicleOrGhost): boolean =>
  blockWaivers.length !== 0

export const hasCurrentBlockWaiver = ({
  blockWaivers,
}: VehicleOrGhost): boolean =>
  blockWaivers.some(
    blockWaiver =>
      currentFuturePastType(blockWaiver) === CurrentFuturePastType.Current
  )

/**
 * has waiver?      | ghost       | vehicle
 * ---------------- | ----------- | -------
 * yes, current     | black       | black
 * yes, not current | highlighted | grey
 * none             | highlighted | none
 */
export const blockWaiverDecoratorStyle = (
  vehicleOrGhost: VehicleOrGhost
): AlertIconStyle | undefined => {
  if (!featureIsEnabled("block_waivers")) {
    return undefined
  }
  if (hasCurrentBlockWaiver(vehicleOrGhost)) {
    return AlertIconStyle.Black
  }
  if (isGhost(vehicleOrGhost)) {
    return AlertIconStyle.Highlighted
  } else {
    return hasBlockWaiver(vehicleOrGhost) ? AlertIconStyle.Grey : undefined
  }
}
