import { BlockWaiver, VehicleOrGhost } from "../realtime"
import { now } from "../util/dateTime"

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
