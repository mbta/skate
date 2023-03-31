import React, { ReactElement } from "react"
import { GhostIcon, NotificationBellIcon } from "../../helpers/icon"
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

const Badge = ({
  text,
  icon,
  modifier,
}: {
  text: string
  icon?: ReactElement
  modifier?: string
}) => (
  <div
    className={`c-block-waiver-banner__badge ${
      modifier ? "c-block-waiver-banner__badge--" + modifier : ""
    }`}
  >
    {icon}
    {text}
  </div>
)

const BlockWaiverBadge = ({ blockWaiver }: { blockWaiver: BlockWaiver }) => {
  const modifier = currentFuturePastClass(blockWaiver)
  switch (currentFuturePastType(blockWaiver)) {
    case CurrentFuturePastType.Past:
      return <Badge text={"Past"} modifier={modifier} />

    case CurrentFuturePastType.Current:
      return (
        <Badge
          text={"Current"}
          icon={
            <span>
              <IconAlertCircle style={AlertIconStyle.Black} />
            </span>
          }
          modifier={modifier}
        />
      )
    case CurrentFuturePastType.Future:
      return (
        <Badge
          text={"Upcoming"}
          icon={
            <NotificationBellIcon className="c-notification-bell-icon--read" />
          }
          modifier={modifier}
        />
      )
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

export const NoWaiverBanner = () => (
  <Card
    additionalClass="c-block-waiver-banner c-block-waiver-banner--unknown"
    style="lemon"
    noFocusOrHover={true}
    title={
      <>
        <h3 className="c-block-waiver-banner__title">Unknown Ghost Bus</h3>
        <Badge text="Ghost" icon={<GhostIcon />} modifier="unknown" />
      </>
    }
  >
    <CardBody>
      A ghost bus or dropped trip has been automatically detected on this route
      but no reason has been logged yet. Once a dispatcher generates a note, it
      will appear here.
    </CardBody>
  </Card>
)

const BlockWaiverBanner = ({ blockWaiver }: Props) => (
  <Card
    additionalClass={`c-block-waiver-banner c-block-waiver-banner--${currentFuturePastClass(
      blockWaiver
    )}`}
    noFocusOrHover={true}
    style={"kiwi"}
    isActive={currentFuturePastType(blockWaiver) !== CurrentFuturePastType.Past}
    title={
      <>
        <h3 className="c-block-waiver-banner__title">Dispatcher Note</h3>
        <BlockWaiverBadge blockWaiver={blockWaiver} />
      </>
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
