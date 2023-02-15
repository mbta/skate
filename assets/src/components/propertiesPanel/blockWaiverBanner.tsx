import React from "react"
import {
  CurrentFuturePastType,
  currentFuturePastType,
} from "../../models/blockWaiver"
import { BlockWaiver } from "../../realtime"
import { formattedTime } from "../../util/dateTime"
import { Card, CardBody, CardProperties } from "../card"
import IconAlertCircle, { AlertIconStyle } from "../iconAlertCircle"

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

const formattedReason = (blockWaiver: BlockWaiver) =>
  [
    blockWaiver.causeDescription,
    (blockWaiver.remark || "")
      .replace(blockWaiver.causeDescription, "")
      .replace(/:$/, ""),
  ]
    .filter((s) => s !== null && s !== "")
    .join(" ")

const BlockWaiverBanner = ({ blockWaiver }: Props) => (
  <Card
    additionalClass={`m-block-waiver-banner m-block-waiver-banner--${currentFuturePastClass(
      blockWaiver
    )}`}
    noFocusOrHover={true}
    style={"kiwi"}
    title={
      <div className="m-block-waiver-banner__header">
        <span className="m-block-waiver-banner__alert-icon">
          <IconAlertCircle style={alertIconStyle(blockWaiver)} />
        </span>
        <div className="m-block-waiver-banner__title">
          Dispatcher Note - {currentFuturePastTitle(blockWaiver)}
        </div>
      </div>
    }
  >
    <CardBody>
      <CardProperties
        properties={[
          {
            label: "Reason",
            value: formattedReason(blockWaiver),
          },
          {
            label: "Start Time",
            value: formattedTime(blockWaiver.startTime),
          },
          {
            label: "End Time",
            value: formattedTime(blockWaiver.endTime),
          },
        ]}
      />
    </CardBody>
  </Card>
)

export default BlockWaiverBanner
