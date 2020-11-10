import React, { ReactElement, useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import VehicleForNotificationContext from "../contexts/vehicleForNotificationContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"
import InactiveNotificationModal from "./inactiveNotificationModal"
import NotificationLoadingModal from "./notificationLoadingModal"

const Modal = (): ReactElement | null => {
  const { connectionStatus } = useContext(SocketContext)
  const [{ selectedNotification }] = useContext(StateDispatchContext)
  const vehicleForNotification = useContext(VehicleForNotificationContext)
  const { hide } = useContext(NotificationsContext)

  if (connectionStatus === ConnectionStatus.Disconnected) {
    return <DisconnectedModal />
  }

  if (selectedNotification && vehicleForNotification === null) {
    return (
      <InactiveNotificationModal
        notification={selectedNotification}
        hide={hide}
      />
    )
  }

  if (selectedNotification && vehicleForNotification === undefined) {
    return <NotificationLoadingModal />
  }
  return null
}

export default Modal
