import React, { useContext } from "react"
import Loading from "./loading"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { closeIcon } from "../helpers/icon"
import { setNotification } from "../state"

const ChelseaLoweredNotificationModal = () => {
  const [, dispatch] = useContext(StateDispatchContext)

  const closeModal = () => {
    dispatch(setNotification(undefined))
  }

  return (
    <>
      <div className="c-modal">
        <div className="m-inactive-notification-modal__close-button">
          <button onClick={closeModal}>{closeIcon()}</button>
        </div>
        <div className="m-notification__title">Chelsea St Bridge Lowered</div>
        <div className="m-inactive-notification-modal__body">
          OCC reports that the Chelsea St Bridge has been lowered.
        </div>
      </div>
      <div className="c-modal-overlay" aria-hidden={true} />
    </>
  )
}

export default ChelseaLoweredNotificationModal
