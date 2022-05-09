import React, { useContext } from "react"
import InputModal from "../inputModal"
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
    <InputModal>
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
        {/* eslint-disable jsx-a11y/no-autofocus */}
        <button
          autoFocus={true}
          className="m-input-modal__button-danger"
          onClick={() => {
            if (window.FS) {
              window.FS.event("Preset deleted")
            }

            deleteCallback(dispatch)
            dispatch(closeInputModal())
          }}
        >
          Confirm
        </button>
        {/* eslint-enable jsx-a11y/no-autofocus */}
      </div>
    </InputModal>
  )
}

export default DeletePresetModal
