import React, { ReactElement } from "react"
import { loadingIcon } from "../../helpers/icon"

const NotificationLoadingModal = (): ReactElement => (
  <>
    <div className="c-modal m-notification-loading-modal">
      <div className="m-notification-loading-modal__spinner-wrapper">
        {loadingIcon("c-loading-spinner")}
      </div>
      <div className="m-notification-loading-modal__text-wrapper">
        Loading...
      </div>
    </div>
    <div className="c-modal-overlay" aria-hidden={true} />
  </>
)

export default NotificationLoadingModal
