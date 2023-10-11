import React, { useContext } from "react"
import InputModal from "../inputModal"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { Action, closeInputModal } from "../../state"
import { fullStoryEvent } from "../../helpers/fullStory"

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
      <div className="c-input-modal__title">
        A preset named{" "}
        <span className="c-input-modal__name-text">{presetName}</span> already
        exists.
      </div>
      <div className="c-input-modal__title">
        Overwrite <span className="c-input-modal__name-text">{presetName}</span>
        ?
      </div>
      <div className="c-input-modal__buttons">
        <button
          className="c-input-modal__button"
          onClick={() => {
            fullStoryEvent("User canceled Overwriting a Saved Preset", {})
            dispatch(closeInputModal())
          }}
        >
          Cancel
        </button>
        {/* eslint-disable jsx-a11y/no-autofocus */}
        <button
          autoFocus={true}
          className="c-input-modal__button--confirm"
          onClick={() => {
            fullStoryEvent("User Overwrote a Saved Preset", {})
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
