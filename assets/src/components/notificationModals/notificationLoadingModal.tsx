import React, { ReactElement } from "react"
import { LoadingIcon } from "../../helpers/icon"

const NotificationLoadingModal = (): ReactElement => (
  <>
    <div className="c-modal c-notification-loading-modal">
      <div className="c-notification-loading-modal__spinner-wrapper">
        <LoadingIcon className="c-loading-spinner" />
      </div>
      <div className="c-notification-loading-modal__text-wrapper">
        Loading...
      </div>
    </div>
    <div className="c-modal-backdrop" aria-hidden={true} />
  </>
)

export default NotificationLoadingModal
