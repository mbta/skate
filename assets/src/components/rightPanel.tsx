import React, { ReactElement, useContext, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehicleOrGhost } from "../realtime.d"
import { setNotification, OpenView } from "../state"
import NotificationDrawer from "./notificationDrawer"
import PropertiesPanel from "./propertiesPanel"
import SwingsView from "./swingsView"

const RightPanel = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost?: VehicleOrGhost | null
}): ReactElement<HTMLElement> | null => {
  const [state, dispatch] = useContext(StateDispatchContext)

  // close notification if you move away from ladder page
  // TODO delete when notifications are viewable from anywhere
  const location = useLocation()
  if (location) {
    /* istanbul ignore next */
    useEffect(() => {
      dispatch(setNotification(undefined))
    }, [location])
  }

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
