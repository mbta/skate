import React from "react"

const DisconnectedModal = () => (
  <>
    <div className="m-disconnected-modal">
      <div>
        Your connection to Skate has expired. Refresh the page to continue.
      </div>
      <button
        className="m-disconnected-modal__refresh-button"
        onClick={() => window.location.reload(false)}
      >
        Refresh
      </button>
    </div>
    <div className="m-disconnected-modal__modal-overlay" />
  </>
)

export default DisconnectedModal
