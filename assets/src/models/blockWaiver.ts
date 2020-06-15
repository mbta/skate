import { AlertIconStyle } from "../components/iconAlertCircle"
import { BlockWaiver, VehicleOrGhost } from "../realtime"
import { now } from "../util/dateTime"
import { isGhost, isLateVehicleIndicator } from "./vehicle"

export enum CurrentFuturePastType {
  Current = 1,
  Future,
  Past,
}

export const currentFuturePastType = (
  { startTime, endTime }: BlockWaiver,
  startThresholdInMinutes: number = 0
): CurrentFuturePastType => {
  const nowDate: Date = now()
  const startThresholdInMilliseconds = startThresholdInMinutes * 60_000
  const maxStartTimeForCurrent =
    nowDate.valueOf() + startThresholdInMilliseconds

  if (startTime.valueOf() > maxStartTimeForCurrent) {
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
    (blockWaiver) =>
      currentFuturePastType(blockWaiver, 240) === CurrentFuturePastType.Current
  )

/**
 * has waiver?              | ghost       | late ghost | vehicle
 * ------------------------ | ----------- | ---------- | -------
 * yes, current or soon     | black       | black      | black
 * yes, not current         | highlighted | none       | none
 * none                     | highlighted | none       | none
 */
export const blockWaiverAlertStyle = (
  vehicleOrGhost: VehicleOrGhost
): AlertIconStyle | undefined => {
  if (hasCurrentBlockWaiver(vehicleOrGhost)) {
    return AlertIconStyle.Black
  }

  if (isGhost(vehicleOrGhost) && !isLateVehicleIndicator(vehicleOrGhost)) {
    return AlertIconStyle.Highlighted
  }

  return undefined
}
