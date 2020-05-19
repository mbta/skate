import React from "react"
import ReactTooltip from "react-tooltip"
import { questionMarkIcon } from "../../../helpers/icon"
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

const ReasonTooltip = () => (
  <ReactTooltip
    id="reason"
    className="m-block-waiver-banner__reason-tooltip"
    place="bottom"
    effect="solid"
    globalEventOff="click"
  >
    <h3>Reason codes</h3>

    <ul>
      <li>
        <strong>B</strong> - Manpower
      </li>
      <li>
        <strong>C</strong> - No equipment
      </li>
      <li>
        <strong>D</strong> - Disabled bus
      </li>
      <li>
        <strong>E</strong> - Diverted to other work
      </li>
      <li>
        <strong>F</strong> - Traffic
      </li>
      <li>
        <strong>G</strong> - Accident
      </li>
      <li>
        <strong>H</strong> - Weather
      </li>
      <li>
        <strong>I</strong> - Operator error
      </li>
      <li>
        <strong>J</strong> - Other
      </li>
    </ul>
  </ReactTooltip>
)

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
          <td
            className="m-block-waiver-banner__detail-label m-block-waiver-banner__reason"
            data-tip={true}
            data-for="reason"
            data-event="click"
          >
            Reason {questionMarkIcon("m-block-waiver-banner__reason-icon")}
          </td>
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

    <ReasonTooltip />
  </div>
)

export default BlockWaiverBanner
