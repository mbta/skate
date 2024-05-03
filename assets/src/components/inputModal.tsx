import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { closeInputModal } from "../state"
import { Modal } from "@restart/ui"

const InputModal = ({
  children,
}: {
  children: JSX.Element | JSX.Element[]
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  return (
    <Modal
      className="c-input-modal"
      onHide={() => {
        dispatch(closeInputModal())
      }}
      show
      renderBackdrop={(props) => (
        <div {...props} className="c-modal-backdrop" />
      )}
    >
      <>{children}</>
    </Modal>
  )
}

export default InputModal
