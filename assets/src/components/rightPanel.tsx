import React, { ReactElement, useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { Ghost, Vehicle } from "../realtime.d"
import { OpenView, closeView } from "../state"
import NotificationDrawer from "./notificationDrawer"
import PropertiesPanel from "./propertiesPanel"
import SwingsView from "./swingsView"

const RightPanel = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost?: Vehicle | Ghost | null
}): ReactElement<HTMLElement> | null => {
  const [state, dispatch] = useContext(StateDispatchContext)

  if (selectedVehicleOrGhost) {
    return (
      <PropertiesPanel
        selectedVehicleOrGhost={selectedVehicleOrGhost}
        closePanel={() => dispatch(closeView())}
      />
    )
  } else if (state.openView === OpenView.Swings) {
    return <SwingsView />
  } else if (state.openView === OpenView.NotificationDrawer) {
    return <NotificationDrawer />
  } else {
    return null
  }
}

export default RightPanel
