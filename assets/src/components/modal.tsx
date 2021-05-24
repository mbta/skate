import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"

const Modal = (): ReactElement | null => {
  const { connectionStatus } = useContext(SocketContext)

  if (connectionStatus === ConnectionStatus.Disconnected) {
    return <DisconnectedModal />
  }

  return null
}

export default Modal
