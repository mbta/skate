import React, { ReactElement, useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import VehicleAndRouteForNotificationContext from "../contexts/vehicleAndRouteForNotificationContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"
import InactiveNotificationModal from "./inactiveNotificationModal"
import NotificationLoadingModal from "./notificationLoadingModal"

const Modal = (): ReactElement | null => {
  const { connectionStatus } = useContext(SocketContext)
  const [{ selectedNotification }] = useContext(StateDispatchContext)
  const vehicleAndRouteForNotification = useContext(
    VehicleAndRouteForNotificationContext
  )
  const { removeNotification } = useContext(NotificationsContext)

  if (connectionStatus === ConnectionStatus.Disconnected) {
    return <DisconnectedModal />
  }

  if (selectedNotification && vehicleAndRouteForNotification === null) {
    return (
      <InactiveNotificationModal
        notification={selectedNotification}
        removeNotification={removeNotification}
      />
    )
  }

  if (selectedNotification && vehicleAndRouteForNotification === undefined) {
    return <NotificationLoadingModal />
  }
  return null
}

export default Modal
