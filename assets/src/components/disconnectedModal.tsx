import React from "react"
import { reload } from "../models/browser"

const DisconnectedModal = () => (
  <>
    <div className="c-modal">
      <div>
        Your connection to Skate has expired. Refresh the page to continue.
      </div>
      <button
        className="m-disconnected-modal__refresh-button"
        onClick={() => reload(false)}
      >
        Refresh
      </button>
    </div>
    <div className="c-modal-overlay" />
  </>
)

export default DisconnectedModal
