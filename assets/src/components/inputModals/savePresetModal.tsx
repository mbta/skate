import React, { useContext } from "react"
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
    <>
      <div
        className="m-input-modal"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            dispatch(closeInputModal())
          }
        }}
      >
        <div className="m-input-modal__title">
          Overwrite{" "}
          <span className="m-input-modal__name-text">{presetName}</span>?
        </div>
        <div className="m-input-modal__buttons">
          <button
            className="m-input-modal__button"
            onClick={() => dispatch(closeInputModal())}
          >
            Cancel
          </button>
          <button
            autoFocus={true}
            className="m-input-modal__button-confirm"
            onClick={() => {
              saveCallback(dispatch)
              dispatch(closeInputModal())
            }}
          >
            Save
          </button>
        </div>
      </div>
      <div className="m-input-modal__overlay" />
    </>
  )
}

export default SavePresetModal
