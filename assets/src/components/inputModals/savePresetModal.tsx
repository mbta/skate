import React, { useContext } from "react"
import InputModal from "../inputModal"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { Action, closeInputModal } from "../../state"

const SavePresetModal = ({
  presetName,
  saveCallback,
}: {
  presetName: string
  saveCallback: (arg0: React.Dispatch<Action>) => void
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  return (
    <InputModal>
      <div className="c-input-modal__title">
        Overwrite <span className="c-input-modal__name-text">{presetName}</span>
        ?
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
          className="c-input-modal__button-confirm"
          onClick={() => {
            saveCallback(dispatch)
            dispatch(closeInputModal())
          }}
        >
          Save
        </button>
        {/* eslint-enable jsx-a11y/no-autofocus */}
      </div>
    </InputModal>
  )
}

export default SavePresetModal
