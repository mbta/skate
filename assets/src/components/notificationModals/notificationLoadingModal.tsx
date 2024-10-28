import React, { ReactElement } from "react"
import { LoadingIcon } from "../../helpers/icon"
import { Modal } from "@restart/ui"

const NotificationLoadingModal = (): ReactElement => (
  <Modal
    className="c-modal c-notification-loading-modal"
    show
    renderBackdrop={(props) => (
      <div {...props} className="c-modal-backdrop" aria-hidden />
    )}
  >
    <div>
      <div className="c-notification-loading-modal__spinner-wrapper">
        <LoadingIcon className="c-loading-spinner" />
      </div>
      <div className="c-notification-loading-modal__text-wrapper">
        Loading...
      </div>
    </div>
  </Modal>
)

export default NotificationLoadingModal
