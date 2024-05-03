import React, { useContext } from "react"
import { Modal } from "@restart/ui"
import { setNotification } from "../../state"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { OldCloseIcon } from "../../helpers/icon"

const BasicNotificationModal = ({
  title,
  body,
}: {
  title: string
  body: string
}) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const closeModal = () => {
    dispatch(setNotification())
  }

  return (
    <Modal
      className="c-modal"
      show
      renderBackdrop={(props) => (
        <div {...props} className="c-modal-backdrop" aria-hidden />
      )}
    >
      <div className="c-basic-notification-modal">
        {/* TODO: Close button IS tab-able, but not visually given focus */}
        <button
          title="Close"
          className="c-basic-notification-modal__close-button"
          onClick={closeModal}
        >
          <OldCloseIcon />
        </button>
        <div>{title}</div>
        <div className="c-basic-notification-modal__body">{body}</div>
      </div>
    </Modal>
  )
}

export default BasicNotificationModal
