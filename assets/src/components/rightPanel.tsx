import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehicleOrGhost } from "../realtime.d"
import { OpenView } from "../state"
import NotificationDrawer from "./notificationDrawer"
import PropertiesPanel from "./propertiesPanel"
import SwingsView from "./swingsView"

const RightPanel = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost?: VehicleOrGhost | null
}): ReactElement<HTMLElement> | null => {
  const [state] = useContext(StateDispatchContext)

  if (selectedVehicleOrGhost) {
    return <PropertiesPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
  } else if (state.openView === OpenView.Swings) {
    return <SwingsView />
  } else if (state.notificationDrawerIsOpen) {
    return <NotificationDrawer />
  } else {
    return null
  }
}

export default RightPanel
