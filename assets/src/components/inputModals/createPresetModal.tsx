import React, { useContext, useState } from "react"
import InputModal from "../inputModal"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { Action, closeInputModal } from "../../state"
import { findPresetByName } from "../../models/routeTab"

const CreatePresetModal = ({
  createCallback,
  confirmOverwriteCallback,
}: {
  createCallback: (arg0: string, arg1: React.Dispatch<Action>) => void
  confirmOverwriteCallback: (
    arg0: string,
    arg1: string,
    arg2: React.Dispatch<Action>
  ) => void
}) => {
  const [{ routeTabs }, dispatch] = useContext(StateDispatchContext)
  const [presetName, setPresetName] = useState<string>("")
  return (
    <InputModal>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const existingPreset = findPresetByName(routeTabs, presetName)
          if (existingPreset) {
            window.FS?.event(
              "User tried to Save new Preset under existing Name"
            )
            confirmOverwriteCallback(presetName, existingPreset.uuid, dispatch)
          } else {
            window.FS?.event("User saved a new Preset")
            createCallback(presetName, dispatch)
            dispatch(closeInputModal())
          }
        }}
      >
        <div className="m-input-modal__title">Save open routes as preset</div>
        <div className="m-input-modal__input">
          {/* eslint-disable jsx-a11y/no-autofocus */}
          <input
            autoFocus={true}
            placeholder="Name your preset&hellip;"
            required={true}
            onChange={(event) => {
              setPresetName(event.currentTarget.value)
            }}
          />
          {/* eslint-enable jsx-a11y/no-autofocus */}
        </div>
        <div className="m-input-modal__buttons">
          <button
            type="button"
            className="m-input-modal__button"
            onClick={() => {
              window.FS?.event("User canceled Creating a new Preset")
              dispatch(closeInputModal())
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={presetName.length === 0}
            className={
              "m-input-modal__button" +
              (presetName.length === 0 ? "-disabled" : "-confirm")
            }
          >
            Save
          </button>
        </div>
      </form>
    </InputModal>
  )
}

export default CreatePresetModal
