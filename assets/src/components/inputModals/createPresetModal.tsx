import React, { useContext, useState } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { Action, closeInputModal } from "../../state"

const CreatePresetModal = ({
  createCallback,
}: {
  createCallback: (arg0: string, arg1: React.Dispatch<Action>) => void
}) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const [presetName, setPresetName] = useState<string>("")
  return (
    <>
      <div className="m-input-modal">
        <div className="m-input-modal__title">Save open routes as preset</div>
        <div className="m-input-modal__input">
          <input
            autoFocus={true}
            placeholder="Name your preset&hellip;"
            onChange={(event) => {
              setPresetName(event.currentTarget.value)
            }}
          />
        </div>
        <div className="m-input-modal__buttons">
          <button
            className="m-input-modal__button"
            onClick={() => dispatch(closeInputModal())}
          >
            Cancel
          </button>
          <button
            disabled={presetName.length === 0}
            className={
              "m-input-modal__button" +
              (presetName.length === 0 ? "-disabled" : "-confirm")
            }
            onClick={() => {
              createCallback(presetName, dispatch)
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

export default CreatePresetModal
