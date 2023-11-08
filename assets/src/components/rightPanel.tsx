import React, { ReactElement } from "react"
import { Ghost, Vehicle } from "../realtime.d"
import NotificationDrawer from "./notificationDrawer"
import PropertiesPanel from "./propertiesPanel"
import SwingsView from "./swingsView"
import { OpenView } from "../state/pagePanelState"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"
import { TabMode } from "./propertiesPanel/tabPanels"

const RightPanel = ({
  selectedVehicleOrGhost,
  initialTab,
}: {
  selectedVehicleOrGhost?: Vehicle | Ghost | null
  initialTab?: TabMode
}): ReactElement<HTMLElement> | null => {
  const {
    currentView: { openView },
    closeView,
  } = usePanelStateFromStateDispatchContext()

  if (selectedVehicleOrGhost) {
    return (
      <PropertiesPanel
        selectedVehicleOrGhost={selectedVehicleOrGhost}
        onClosePanel={closeView}
        initialTab={initialTab}
      />
    )
  } else if (openView === OpenView.Swings) {
    return <SwingsView />
  } else if (openView === OpenView.NotificationDrawer) {
    return <NotificationDrawer />
  } else {
    return null
  }
}

export default RightPanel
