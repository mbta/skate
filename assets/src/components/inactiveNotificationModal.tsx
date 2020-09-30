import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { closeIcon } from "../helpers/icon"
import { Notification } from "../realtime.d"
import { setNotification } from "../state"
import { title } from "./notifications"

const InactiveNotificationModal = ({
  notification,
  removeNotification,
  setInactiveNotification,
}: {
  notification: Notification
  removeNotification: (id: number) => void
  setInactiveNotification: (notification: Notification | null) => void
}) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const closeModal = () => {
    setInactiveNotification(null)
    dispatch(setNotification(undefined))
  }

  const removeNotificationAndClose = () => {
    removeNotification(notification.id)
    closeModal()
  }

  return (
    <>
      <div className="m-modal">
        <div className="m-invalid-notification-modal__close-button">
          <button onClick={closeModal}>{closeIcon()}</button>
        </div>
        <div className="m-notification__title">
          {title(notification.reason)} NOTIFICATION
        </div>
        <div className="m-invalid-notification-modal__body">
          {runIdPhrase(notification)} currently active in Skate. This
          notification may no longer be relevant.
        </div>
        <div className="m-invalid-notification-modal__buttons">
          <div className="m-invalid-notification-modal__button-wrapper">
            <button
              className="m-invalid-notification-modal__keep-button"
              onClick={closeModal}
            >
              Keep
            </button>
          </div>
          <div className="m-invalid-notification-modal__button-wrapper">
            <button
              className="m-invalid-notification-modal__discard-button"
              onClick={removeNotificationAndClose}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
      <div className="m-modal-overlay" />
    </>
  )
}

const runIdPhrase = (notification: Notification): string => {
  if (notification.runIds.length === 0) {
    return "No runs associated with this notification are"
  }

  if (notification.runIds.length === 1) {
    return `Run ${notification.runIds[0]} is not`
  }

  return `Runs ${notification.runIds.join(", ")} are not`
}

export default InactiveNotificationModal
