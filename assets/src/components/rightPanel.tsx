import React, { ReactElement } from "react"
import { Ghost, Vehicle } from "../realtime.d"
import NotificationDrawer from "./notificationDrawer"
import PropertiesPanel from "./propertiesPanel"
import SwingsView from "./swingsView"
import { OpenView } from "../state/pagePanelState"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"

const RightPanel = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost?: Vehicle | Ghost | null
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
