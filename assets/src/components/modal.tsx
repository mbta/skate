import React, { ReactElement, useContext } from "react"
import { InactiveNotificationContext } from "../contexts/inactiveNotificationContext"
import { NotificationsContext } from "../contexts/notificationsContext"
import { SocketContext } from "../contexts/socketContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"
import InactiveNotificationModal from "./inactiveNotificationModal"

const Modal = (): ReactElement | null => {
  const { connectionStatus } = useContext(SocketContext)
  const [inactiveNotification, setInactiveNotification] = useContext(
    InactiveNotificationContext
  )
  const { removeNotification } = useContext(NotificationsContext)

  if (connectionStatus === ConnectionStatus.Disconnected) {
    return <DisconnectedModal />
  }

  if (inactiveNotification) {
    return (
      <InactiveNotificationModal
        notification={inactiveNotification}
        removeNotification={removeNotification}
        setInactiveNotification={setInactiveNotification}
      />
    )
  }

  return null
}

export default Modal
