import React, { ReactElement, useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ConnectionStatus } from "../hooks/useSocket"
import DisconnectedModal from "./disconnectedModal"
import InactiveNotificationModal from "./notificationModals/inactiveNotificationModal"
import NotificationLoadingModal from "./notificationModals/notificationLoadingModal"
import ChelseaRaisedNotificationModal from "./notificationModals/chelseaRaisedNotificationModal"
import ChelseaLoweredNotificationModal from "./notificationModals/chelseaLoweredNotificationModal"
import CreatePresetModal from "./inputModals/createPresetModal"
import SavePresetModal from "./inputModals/savePresetModal"
import DeletePresetModal from "./inputModals/deletePresetModal"
import OverwritePresetModal from "./inputModals/overwritePresetModal"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"
import { isBlockWaiverNotification, NotificationType } from "../realtime"

const Modal = (): ReactElement | null => {
  const { connectionStatus } = useContext(SocketContext)
  const [state] = useContext(StateDispatchContext)
  const { selectedNotification, openInputModal } = state
  const {
    currentView: { selectedVehicleOrGhost },
  } = usePanelStateFromStateDispatchContext()
  if (connectionStatus === ConnectionStatus.Disconnected) {
    return <DisconnectedModal />
  }

  if (
    selectedNotification &&
    isBlockWaiverNotification(selectedNotification) &&
    selectedVehicleOrGhost === null
  ) {
    return <InactiveNotificationModal notification={selectedNotification} />
  }

  if (selectedNotification?.content.$type === NotificationType.BridgeMovement) {
    switch (selectedNotification.content.status) {
      case "lowered": {
        return <ChelseaLoweredNotificationModal />
      }
      case "raised": {
        return (
          <ChelseaRaisedNotificationModal
            notification={selectedNotification.content}
          />
        )
      }
    }
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
      case "OVERWRITE_PRESET":
        return (
          <OverwritePresetModal
            presetName={openInputModal.presetName}
            confirmCallback={openInputModal.confirmCallback}
          />
        )
    }
  }

  return null
}

export default Modal
