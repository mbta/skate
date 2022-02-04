import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { Action, closeInputModal } from "../../state"

const DeletePresetModal = ({
  presetName,
  deleteCallback,
}: {
  presetName: string
  deleteCallback: (arg0: React.Dispatch<Action>) => void
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  return (
    <div className="m-input-modal">
      <div className="m-input-modal__title">Delete preset?</div>
      <div className="m-input-modal__text">
        <span className="m-input-modal__name-text">{presetName}</span>
      </div>
      <div className="m-input-modal__buttons">
        <button
          className="m-input-modal__button"
          onClick={() => dispatch(closeInputModal())}
        >
          Cancel
        </button>
        <button
          className="m-input-modal__button-danger"
          onClick={() => {
            deleteCallback(dispatch)
            dispatch(closeInputModal())
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

export default DeletePresetModal
