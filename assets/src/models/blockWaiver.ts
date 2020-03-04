import featureIsEnabled from "../laboratoryFeatures"
import { BlockWaiver, VehicleOrGhost } from "../realtime"
import { now } from "../util/dateTime"
import { isGhost } from "./vehicle"

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

export enum BlockWaiverDecoratorStyle {
  None = 0,
  Black,
  Grey,
  Highlighted,
}

/**
 * has waiver?      | ghost       | vehicle
 * ---------------- | ----------- | -------
 * yes, current     | black       | black
 * yes, not current | highlighted | grey
 * none             | highlighted | none
 */
export const blockWaiverDecoratorStyle = (
  vehicleOrGhost: VehicleOrGhost
): BlockWaiverDecoratorStyle => {
  if (!featureIsEnabled("block_waivers")) {
    return BlockWaiverDecoratorStyle.None
  }
  if (hasCurrentBlockWaiver(vehicleOrGhost)) {
    return BlockWaiverDecoratorStyle.Black
  }
  if (isGhost(vehicleOrGhost)) {
    return BlockWaiverDecoratorStyle.Highlighted
  } else {
    return hasBlockWaiver(vehicleOrGhost)
      ? BlockWaiverDecoratorStyle.Grey
      : BlockWaiverDecoratorStyle.None
  }
}
