import * as Sentry from "@sentry/react"
import React, { ReactElement, useContext } from "react"
import { useHistory } from "react-router-dom"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import VehicleForNotificationContext from "../contexts/vehicleForNotificationContext"
import { VehicleOrGhost } from "../realtime.d"
import { setNotification } from "../state"
import PropertiesPanel from "./propertiesPanel"

const RightPanel = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost?: VehicleOrGhost
}): ReactElement<HTMLElement> | null => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const { selectedNotification } = state
  const vehicleForNotification = useContext(VehicleForNotificationContext)

  // close notification if you move away from ladder page
  // TODO delete when notifications are viewable from anywhere
  const history = useHistory()
  if (history) {
    /* istanbul ignore next */
    history.listen(() => dispatch(setNotification(undefined)))
  }

  if (vehicleForNotification && selectedVehicleOrGhost) {
    /* istanbul ignore next */
    Sentry.captureMessage(
      "vehicleForNotification and selectedVehicleOrGhost both set, which should be impossible"
    )
  }

  if (selectedNotification && vehicleForNotification) {
    return <PropertiesPanel selectedVehicleOrGhost={vehicleForNotification} />
  } else if (
    state.selectedVehicleId &&
    selectedVehicleOrGhost?.id === state.selectedVehicleId
  ) {
    return <PropertiesPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
  } else {
    return null
  }
}

export default RightPanel
