import React from "react"
import {
  CurrentFuturePastType,
  currentFuturePastType,
} from "../../../models/blockWaiver"
import { BlockWaiver } from "../../../realtime"
import { formattedTime } from "../../../util/dateTime"
import IconAlertCircle, { AlertIconStyle } from "../../iconAlertCircle"

interface Props {
  blockWaiver: BlockWaiver
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

const alertIconStyle = (blockWaiver: BlockWaiver): AlertIconStyle => {
  switch (currentFuturePastType(blockWaiver)) {
    case CurrentFuturePastType.Current:
      return AlertIconStyle.Black
    case CurrentFuturePastType.Future:
      return AlertIconStyle.GreyOnGrey
    case CurrentFuturePastType.Past:
      return AlertIconStyle.GreyOnGrey
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
        <IconAlertCircle style={alertIconStyle(blockWaiver)} />
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
            {[
              blockWaiver.causeDescription,
              (blockWaiver.remark || "")
                .replace(blockWaiver.causeDescription, "")
                .replace(/:$/, ""),
            ]
              .filter((s) => s !== null && s !== "")
              .join(" ")}
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
