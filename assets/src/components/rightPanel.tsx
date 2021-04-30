import React, { ReactElement, useContext } from "react"
import { useHistory } from "react-router-dom"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehicleOrGhost } from "../realtime.d"
import { setNotification } from "../state"
import NotificationDrawer from "./notificationDrawer"
import PropertiesPanel from "./propertiesPanel"
import SwingsView from "./swingsView"

const RightPanel = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost?: VehicleOrGhost
}): ReactElement<HTMLElement> | null => {
  const [state, dispatch] = useContext(StateDispatchContext)

  // close notification if you move away from ladder page
  // TODO delete when notifications are viewable from anywhere
  const history = useHistory()
  if (history) {
    /* istanbul ignore next */
    history.listen(() => dispatch(setNotification(undefined)))
  }

  if (selectedVehicleOrGhost) {
    return <PropertiesPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
  } else if (state.swingsViewIsVisible) {
    return <SwingsView />
  } else if (state.notificationDrawerIsOpen) {
    return <NotificationDrawer />
  } else {
    return null
  }
}

export default RightPanel
