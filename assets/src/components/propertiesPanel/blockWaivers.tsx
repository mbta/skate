import React from "react"
import { alertCircleIcon } from "../../helpers/icon"
import { BlockWaiver } from "../../realtime"

interface Props {
  blockWaivers: BlockWaiver[]
}

export const hours12 = (hours24plus: number): number => {
  if (hours24plus === 24) {
    return 12
  }
  if (hours24plus > 24) {
    return hours24plus - 24
  }
  if (hours24plus > 12) {
    return hours24plus - 12
  }
  return hours24plus
}

const ampm = (hours24plus: number): string =>
  hours24plus >= 12 && hours24plus < 24 ? "pm" : "am"

/**
 * Formats a time of day (seconds after midnight) nicely.
 * e.g. given 18300, returns "5:05am"
 * e.g. given 81840, returns "10:42pm"
 *
 * @param timeOfDay seconds after midnight
 */
export const formatTimeOfDay = (timeOfDay: number): string => {
  const hours24plus = Math.floor(timeOfDay / 3600)
  const hours = hours12(hours24plus)
  const minutesNum = Math.floor((timeOfDay % 3600) / 60)
  const minutesStr = minutesNum < 10 ? `0${minutesNum}` : minutesNum

  return `${hours}:${minutesStr}${ampm(hours24plus)}`
}

export const nowTimeOfDay = (now = new Date()): number =>
  now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

export enum CurrentFuturePastType {
  Current = 1,
  Future,
  Past,
}

export const currentFuturePastType = ({
  startTime,
  endTime,
}: BlockWaiver): CurrentFuturePastType => {
  const now = nowTimeOfDay()

  if (startTime > now) {
    return CurrentFuturePastType.Future
  } else if (endTime < now) {
    return CurrentFuturePastType.Past
  } else {
    return CurrentFuturePastType.Current
  }
}

export const currentFuturePastClass = (blockWaiver: BlockWaiver): string => {
  switch (currentFuturePastType(blockWaiver)) {
    case CurrentFuturePastType.Current:
      return "current"
    case CurrentFuturePastType.Future:
      return "future"
    case CurrentFuturePastType.Past:
      return "past"
  }
}

export const currentFuturePastTitle = (blockWaiver: BlockWaiver): string => {
  switch (currentFuturePastType(blockWaiver)) {
    case CurrentFuturePastType.Current:
      return "Current"
    case CurrentFuturePastType.Future:
      return "Future Notice"
    case CurrentFuturePastType.Past:
      return "Past Notice"
  }
}

const BlockWaiver = ({ blockWaiver }: { blockWaiver: BlockWaiver }) => (
  <div
    className={`m-block-waiver m-block-waiver--${currentFuturePastClass(
      blockWaiver
    )}`}
  >
    <div className="m-block-waiver__header">
      {alertCircleIcon("m-block-waiver__alert-icon")}
      <div className="m-block-waiver__title">
        Dispatcher Note — {currentFuturePastTitle(blockWaiver)}
      </div>
    </div>

    <table className="m-block-waiver__details">
      <tbody>
        <tr>
          <td className="m-block-waiver__detail-label">Reason</td>
          <td className="m-block-waiver__detail-value">{blockWaiver.remark}</td>
        </tr>
        <tr>
          <td className="m-block-waiver__detail-label m-block-waiver__detail-label--start-time">
            Start Time
          </td>
          <td className="m-block-waiver__detail-value m-block-waiver__detail-value--start-time">
            {formatTimeOfDay(blockWaiver.startTime)}
          </td>
        </tr>
        <tr>
          <td className="m-block-waiver__detail-label m-block-waiver__detail-label--end-time">
            End Time
          </td>
          <td className="m-block-waiver__detail-value m-block-waiver__detail-value--end-time">
            {formatTimeOfDay(blockWaiver.endTime)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

const BlockWaivers = ({ blockWaivers }: Props) => (
  <div className="m-block-waivers">
    {blockWaivers.map(blockWaiver => (
      <BlockWaiver
        blockWaiver={blockWaiver}
        key={`${blockWaiver.startTime}-${blockWaiver.endTime}`}
      />
    ))}
  </div>
)

export default BlockWaivers
