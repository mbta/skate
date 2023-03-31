import React from "react"
import { reload } from "../models/browser"

const DisconnectedModal = () => (
  <>
    <div className="c-modal">
      <div>
        Your connection to Skate has expired. Refresh the page to continue.
      </div>
      <button className="c-disconnected-modal__refresh-button" onClick={reload}>
        Refresh
      </button>
    </div>
    <div className="c-modal-backdrop" aria-hidden={true} />
  </>
)

export default DisconnectedModal
