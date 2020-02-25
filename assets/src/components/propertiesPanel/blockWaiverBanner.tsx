import React from "react"
import { alertCircleIcon } from "../../helpers/icon"
import { BlockWaiver } from "../../realtime"

interface Props {
  blockWaiver: BlockWaiver
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

const zeroPad = (time: number): string => (time < 10 ? `0${time}` : `${time}`)

export const dateFromEpochSeconds = (time: number): Date =>
  new Date(time * 1_000)

export const formattedTime = (date: Date): string => {
  const hours24 = date.getHours()
  return `${hours12(hours24)}:${zeroPad(date.getMinutes())}${ampm(hours24)}`
}

export const formatEpochSeconds = (epochSeconds: number): string => {
  const date = dateFromEpochSeconds(epochSeconds)
  return formattedTime(date)
}

export const nowEpochSeconds = (now = Date.now()): number =>
  Math.floor(now / 1_000)

export enum CurrentFuturePastType {
  Current = 1,
  Future,
  Past,
}

export const currentFuturePastType = ({
  startTime,
  endTime,
}: BlockWaiver): CurrentFuturePastType => {
  const now = nowEpochSeconds()

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
      return "Future"
    case CurrentFuturePastType.Past:
      return "Past"
  }
}

const BlockWaiverBanner = ({ blockWaiver }: Props) => (
  <div
    className={`m-block-waiver-banner m-block-waiver-banner--${currentFuturePastClass(
      blockWaiver
    )}`}
  >
    <div className="m-block-waiver-banner__header">
      {alertCircleIcon("m-block-waiver-banner__alert-icon")}
      <div className="m-block-waiver-banner__title">
        Dispatcher Note - {currentFuturePastTitle(blockWaiver)}
      </div>
    </div>

    <table className="m-block-waiver-banner__details">
      <tbody>
        <tr>
          <td className="m-block-waiver-banner__detail-label">Reason</td>
          <td className="m-block-waiver-banner__detail-value">
            {blockWaiver.remark}
          </td>
        </tr>
        <tr>
          <td className="m-block-waiver-banner__detail-label m-block-waiver-banner__detail-label--start-time">
            Start Time
          </td>
          <td className="m-block-waiver-banner__detail-value m-block-waiver-banner__detail-value--start-time">
            {formatEpochSeconds(blockWaiver.startTime)}
          </td>
        </tr>
        <tr>
          <td className="m-block-waiver-banner__detail-label m-block-waiver-banner__detail-label--end-time">
            End Time
          </td>
          <td className="m-block-waiver-banner__detail-value m-block-waiver-banner__detail-value--end-time">
            {formatEpochSeconds(blockWaiver.endTime)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

export default BlockWaiverBanner
