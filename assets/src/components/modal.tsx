import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"
import InactiveNotificationModal from "./inactiveNotificationModal"
import NotificationLoadingModal from "./notificationLoadingModal"
import CreatePresetModal from "./inputModals/createPresetModal"
import SavePresetModal from "./inputModals/savePresetModal"
import DeletePresetModal from "./inputModals/deletePresetModal"

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
          <CreatePresetModal
            createCallback={openInputModal.createCallback}
            confirmOverwriteCallback={openInputModal.confirmOverwriteCallback}
          />
        )
      case "SAVE_PRESET":
        return (
          <SavePresetModal
            presetName={openInputModal.presetName}
            saveCallback={openInputModal.saveCallback}
          />
        )
      case "DELETE_PRESET":
        return (
          <DeletePresetModal
            presetName={openInputModal.presetName}
            deleteCallback={openInputModal.deleteCallback}
          />
        )
    }
  }

  return null
}

export default Modal
