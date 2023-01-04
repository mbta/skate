import React, { useContext } from "react"
import {
  instantiatePreset,
  promptToSaveOrCreatePreset,
  promptToDeletePreset,
} from "../state"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { currentRouteTab, isPreset, isEditedPreset } from "../models/routeTab"
import { PlusThinIcon } from "../helpers/icon"
import { tagManagerEvent } from "../helpers/googleTagManager"
import CloseButton from "./closeButton"

const Presets = () => {
  const [{ routeTabs }, dispatch] = useContext(StateDispatchContext)
  const presets = routeTabs
    .filter(isPreset)
    .sort((a, b) => (a.presetName || "").localeCompare(b.presetName || ""))

  const currentTab = currentRouteTab(routeTabs)

  return (
    <div className="m-presets-panel">
      <ul>
        {presets.map((preset) => (
          <li key={preset.uuid}>
            <div className="m-presets-panel__preset-button-container">
              <button onClick={() => dispatch(instantiatePreset(preset.uuid))}>
                {preset.presetName}
              </button>
            </div>
            <CloseButton
              closeButtonType="l_light"
              onClick={() => {
                dispatch(promptToDeletePreset(preset))
              }}
            />
          </li>
        ))}
      </ul>
      <button
        className="m-presets-panel__save-as-preset-button"
        onClick={() => {
          if (currentTab) {
            tagManagerEvent("preset_saved_from_presets_panel")
            dispatch(promptToSaveOrCreatePreset(currentTab))
          }
        }}
        disabled={
          !currentTab || (isPreset(currentTab) && !isEditedPreset(currentTab))
        }
      >
        <PlusThinIcon className="m-presets-panel__save-as-preset-button-icon" />
        Save as preset
      </button>
    </div>
  )
}

export default Presets
