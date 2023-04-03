import React, { useContext } from "react"
import InputModal from "../inputModal"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { Action, closeInputModal } from "../../state"
import { tagManagerEvent } from "../../helpers/googleTagManager"

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
      <div className="c-input-modal__title">Delete preset?</div>
      <div className="c-input-modal__text">
        <span className="c-input-modal__name-text">{presetName}</span>
      </div>
      <div className="c-input-modal__buttons">
        <button
          className="c-input-modal__button"
          onClick={() => dispatch(closeInputModal())}
        >
          Cancel
        </button>
        {/* eslint-disable jsx-a11y/no-autofocus */}
        <button
          autoFocus={true}
          className="c-input-modal__button--danger"
          onClick={() => {
            tagManagerEvent("preset_deleted")
            window.FS?.event("User deleted a preset")

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
