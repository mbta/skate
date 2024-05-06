import React from "react"
import { reload } from "../models/browser"
import { Modal } from "@restart/ui"

const DisconnectedModal = () => (
  <Modal
    className="c-modal"
    show
    renderBackdrop={(props) => (
      <div {...props} className="c-modal-backdrop" aria-hidden />
    )}
  >
    <>
      <div>
        Your connection to Skate has expired. Refresh the page to continue.
      </div>
      <button className="c-disconnected-modal__refresh-button" onClick={reload}>
        Refresh
      </button>
    </>
  </Modal>
)

export default DisconnectedModal
