import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { closeIcon } from "../helpers/icon"
import { setNotification } from "../state"
import { formattedTime } from "../util/dateTime"

const ChelseaRaisedNotificationModal = ({
  notification,
}: {
  notification: Notification
}) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const closeModal = () => {
    dispatch(setNotification(undefined))
  }

  const endTime = formattedTime(notification.endTime)

  return (
    <>
      <div className="c-modal">
        <div className="m-inactive-notification-modal__close-button">
          <button onClick={closeModal}>{closeIcon()}</button>
        </div>
        <div className="m-notification__title">Chelsea St Bridge Raised</div>
        <div className="m-inactive-notification-modal__body">
          OCC reported that the Chelsea St Bridge will be raised until {endTime}
          .
        </div>
      </div>
      <div className="c-modal-overlay" aria-hidden={true} />
    </>
  )
}

export default ChelseaRaisedNotificationModal
