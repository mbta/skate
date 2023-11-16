import React, { ReactElement, ReactNode } from "react"
import NotificationDrawer from "./notificationDrawer"
import SwingsView from "./swingsView"
import { OpenView } from "../state/pagePanelState"
import LateView from "./lateView"

type RightPanelProps = {
  openView: OpenView
  propertiesPanel?: ReactNode
}

const RightPanel = ({
  openView,
  propertiesPanel,
}: RightPanelProps): ReactElement | null => {
  if (propertiesPanel !== undefined) {
    return <>{propertiesPanel}</>
  } else if (openView === OpenView.Swings) {
    return <SwingsView />
  } else if (openView === OpenView.Late) {
    return <LateView />
  } else if (openView === OpenView.NotificationDrawer) {
    return <NotificationDrawer />
  }

  return null
}

export default RightPanel
