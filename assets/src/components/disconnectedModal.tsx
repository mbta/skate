import React, { useContext } from "react"
import { Modal } from "@restart/ui"
import { SocketContext } from "../contexts/socketContext"
import { disconnectAndReload } from "../helpers/socketLifecycle"

const DisconnectedModal = () => {
  const { socket } = useContext(SocketContext)

  return (
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
        <button
          className="c-disconnected-modal__refresh-button"
          onClick={() => disconnectAndReload(socket)}
        >
          Refresh
        </button>
      </>
    </Modal>
  )
}

export default DisconnectedModal
