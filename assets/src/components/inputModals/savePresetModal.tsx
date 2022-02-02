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
    <div className="c-modal m-input-modal">
      <div className="m-input-modal__title">Overwrite {presetName}</div>
      <div className="m-input-modal__buttons">
        <button onClick={() => dispatch(closeInputModal())}>Cancel</button>
        <button
          onClick={() => {
            saveCallback(dispatch)
            dispatch(closeInputModal())
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default SavePresetModal
