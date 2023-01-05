import React from "react"
import { ChevronLeftIcon } from "../helpers/icon"
import useDeviceType from "../hooks/useDeviceType"
import { OpenView } from "../state"
import CloseButton from "./closeButton"

interface CommonProps {
  title: string
  closeView: () => void
}

type NoBacklinkProps = CommonProps
type BacklinkProps = CommonProps & {
  backlinkToView: OpenView
  followBacklink: () => void
}

type ViewHeaderType = {
  (props: NoBacklinkProps): JSX.Element
  (props: BacklinkProps): JSX.Element
}

const ViewHeader: ViewHeaderType = ({
  title,
  closeView,
  backlinkToView,
  followBacklink,
}: CommonProps & {
  backlinkToView?: OpenView
  followBacklink?: () => void
}): JSX.Element => {
  const deviceType = useDeviceType()

  return (
    <div className="m-view-header">
      {backlinkToView &&
      backlinkToView !== OpenView.None &&
      deviceType === "mobile" ? (
        <button
          className="m-view-header__backlink"
          onClick={followBacklink}
          title={backlinkTitle(backlinkToView)}
        >
          <ChevronLeftIcon />
          {backlinkTitle(backlinkToView)}
        </button>
      ) : null}
      <div className="m-view-header__title" role="heading" aria-level={2}>
        {title}
      </div>
      <CloseButton closeButtonType="xl_light" onClick={closeView} />
    </div>
  )
}

const backlinkTitle = (view: OpenView): string | undefined => {
  switch (view) {
    case OpenView.Swings:
      return "Swings"
    case OpenView.Late:
      return "Late View"
    case OpenView.NotificationDrawer:
      return "Notifications"
    default:
      return undefined
  }
}

export default ViewHeader
