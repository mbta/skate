import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { OldCloseIcon } from "../../helpers/icon"
import { setNotification } from "../../state"
import { Notification } from "../../realtime.d"
import { formattedTime } from "../../util/dateTime"

const ChelseaRaisedNotificationModal = ({
  notification,
}: {
  notification: Notification
}) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const closeModal = () => {
    dispatch(setNotification())
  }

  const contentString = (endDate: Date | null): string => {
    if (endDate)
      return (
        "OCC reported that the Chelsea St Bridge will be raised until " +
        formattedTime(endDate) +
        "."
      )
    else return "OCC reported that the Chelsea St Bridge has been raised."
  }

  return (
    <>
      <div className="c-modal">
        <div className="c-inactive-notification-modal__close-button">
          <button title="Close" onClick={closeModal}>
            <OldCloseIcon />
          </button>
        </div>
        <div className="m-notification__title">Chelsea St Bridge Raised</div>
        <div className="c-inactive-notification-modal__body">
          {contentString(notification.endTime)}
        </div>
      </div>
      <div className="c-modal-backdrop" aria-hidden={true} />
    </>
  )
}

export default ChelseaRaisedNotificationModal
