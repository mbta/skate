import React, { ReactElement, useContext } from "react"
import { NotificationsContext } from "../contexts/notificationsContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"
import InactiveNotificationModal from "./inactiveNotificationModal"

const Modal = (): ReactElement | null => {
  const { connectionStatus } = useContext(SocketContext)
  const [{ selectedNotification, selectedNotificationIsInactive }] = useContext(
    StateDispatchContext
  )
  const { removeNotification } = useContext(NotificationsContext)

  if (connectionStatus === ConnectionStatus.Disconnected) {
    return <DisconnectedModal />
  }

  if (selectedNotification && selectedNotificationIsInactive) {
    return (
      <InactiveNotificationModal
        notification={selectedNotification}
        removeNotification={removeNotification}
      />
    )
  }

  return null
}

export default Modal
