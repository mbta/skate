import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"
import InactiveNotificationModal from "./inactiveNotificationModal"
import NotificationLoadingModal from "./notificationLoadingModal"
import CreatePresetModal from "./inputModals/createPresetModal"
import SavePresetModal from "./inputModals/savePresetModal"

const Modal = (): ReactElement | null => {
  const { connectionStatus } = useContext(SocketContext)
  const [state] = useContext(StateDispatchContext)
  const { selectedNotification, selectedVehicleOrGhost, openInputModal } = state

  if (connectionStatus === ConnectionStatus.Disconnected) {
    return <DisconnectedModal />
  }

  if (selectedNotification && selectedVehicleOrGhost === null) {
    return <InactiveNotificationModal notification={selectedNotification} />
  }

  if (selectedNotification && selectedVehicleOrGhost === undefined) {
    return <NotificationLoadingModal />
  }

  if (openInputModal) {
    switch (openInputModal.type) {
      case "CREATE_PRESET":
        return (
          <CreatePresetModal createCallback={openInputModal.createCallback} />
        )
      case "SAVE_PRESET":
        return (
          <SavePresetModal
            presetName={openInputModal.presetName}
            saveCallback={openInputModal.saveCallback}
          />
        )
    }
  }

  return null
}

export default Modal
