import React, { useContext } from "react"
import InputModal from "../inputModal"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { Action, closeInputModal } from "../../state"

const OverwritePresetModal = ({
  presetName,
  confirmCallback,
}: {
  presetName: string
  confirmCallback: (arg0: React.Dispatch<Action>) => void
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  return (
    <InputModal>
      <div className="m-input-modal__title">
        A preset named{" "}
        <span className="m-input-modal__name-text">{presetName}</span> already
        exists.
      </div>
      <div className="m-input-modal__title">
        Overwrite <span className="m-input-modal__name-text">{presetName}</span>
        ?
      </div>
      <div className="m-input-modal__buttons">
        <button
          className="m-input-modal__button"
          onClick={() => {
            window.FS?.event("User canceled Overwriting a Saved Preset")
            dispatch(closeInputModal())
          }}
        >
          Cancel
        </button>
        {/* eslint-disable jsx-a11y/no-autofocus */}
        <button
          autoFocus={true}
          className="m-input-modal__button-confirm"
          onClick={() => {
            window.FS?.event("User Overwrote a Saved Preset")
            confirmCallback(dispatch)
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

export default OverwritePresetModal
