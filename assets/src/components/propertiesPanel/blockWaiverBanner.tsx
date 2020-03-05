import React from "react"
import { BlockWaiver } from "../../realtime"
import { now, formattedTime } from "../../util/dateTime"
import IconAlertCircle from "../iconAlertCircle"

interface Props {
  blockWaiver: BlockWaiver
}

export enum CurrentFuturePastType {
  Current = 1,
  Future,
  Past,
}

const currentFuturePastType = ({
  startTime,
  endTime,
}: BlockWaiver): CurrentFuturePastType => {
  const nowDate = now()

  if (startTime > nowDate) {
    return CurrentFuturePastType.Future
  } else if (endTime < nowDate) {
    return CurrentFuturePastType.Past
  } else {
    return CurrentFuturePastType.Current
  }
}

const currentFuturePastClass = (blockWaiver: BlockWaiver): string => {
  switch (currentFuturePastType(blockWaiver)) {
    case CurrentFuturePastType.Current:
      return "current"
    case CurrentFuturePastType.Future:
      return "future"
    case CurrentFuturePastType.Past:
      return "past"
  }
}

const currentFuturePastTitle = (blockWaiver: BlockWaiver): string => {
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
      <span className="m-block-waiver-banner__alert-icon">
        <IconAlertCircle />
      </span>
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
            {formattedTime(blockWaiver.startTime)}
          </td>
        </tr>
        <tr>
          <td className="m-block-waiver-banner__detail-label m-block-waiver-banner__detail-label--end-time">
            End Time
          </td>
          <td className="m-block-waiver-banner__detail-value m-block-waiver-banner__detail-value--end-time">
            {formattedTime(blockWaiver.endTime)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

export default BlockWaiverBanner
