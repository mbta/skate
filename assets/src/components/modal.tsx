import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"
import InactiveNotificationModal from "./inactiveNotificationModal"
import NotificationLoadingModal from "./notificationLoadingModal"

const Modal = (): ReactElement | null => {
  const { connectionStatus } = useContext(SocketContext)
  const [state] = useContext(StateDispatchContext)
  const { selectedNotification, selectedVehicleOrGhost } = state

  if (connectionStatus === ConnectionStatus.Disconnected) {
    return <DisconnectedModal />
  }

  if (selectedNotification && selectedVehicleOrGhost === null) {
    return <InactiveNotificationModal notification={selectedNotification} />
  }

  if (selectedNotification && selectedVehicleOrGhost === undefined) {
    return <NotificationLoadingModal />
  }

  return null
}

export default Modal
