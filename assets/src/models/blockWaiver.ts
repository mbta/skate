import { AlertIconStyle } from "../components/iconAlertCircle"
import { BlockWaiver, VehicleOrGhost } from "../realtime"
import { now } from "../util/dateTime"
import { isGhost, isLateVehicleIndicator } from "./vehicle"

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
 * has waiver?      | ghost       | vehicle and late indicator ghosts
 * ---------------- | ----------- | ---------------------------------
 * yes, current     | black       | black
 * yes, not current | highlighted | grey
 * none             | highlighted | none
 */
export const blockWaiverAlertStyle = (
  vehicleOrGhost: VehicleOrGhost
): AlertIconStyle | undefined => {
  if (hasCurrentBlockWaiver(vehicleOrGhost)) {
    return AlertIconStyle.Black
  }
  if (isGhost(vehicleOrGhost) && !isLateVehicleIndicator(vehicleOrGhost)) {
    return AlertIconStyle.Highlighted
  } else {
    return hasBlockWaiver(vehicleOrGhost) ? AlertIconStyle.Grey : undefined
  }
}
