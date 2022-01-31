import React, { useContext } from "react"
import { createPreset, instantiatePreset, savePreset } from "../state"
import CloseButton from "./closeButton"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { currentRouteTab, isPreset, isEditedPreset } from "../models/routeTab"
import { plusThinIcon } from "../helpers/icon"

const Presets = () => {
  const [{ routeTabs }, dispatch] = useContext(StateDispatchContext)
  const presets = routeTabs.filter(isPreset)

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
              onClick={() => {
                return
              }}
            />
          </li>
        ))}
      </ul>
      <button
        className="m-presets-panel__save-as-preset-button"
        onClick={() => {
          const currentTab = currentRouteTab(routeTabs)

          if (currentTab) {
            if (isEditedPreset(currentTab)) {
              dispatch(savePreset(currentTab.uuid))
            } else if (!isPreset(currentTab)) {
              dispatch(
                createPreset(
                  currentTab.uuid,
                  `Preset ${Math.floor(Math.random() * 10000)}`
                )
              )
            }
          }
        }}
      >
        {plusThinIcon("m-presets-panel__save-as-preset-button-icon")}
        Save as preset
      </button>
    </div>
  )
}

export default Presets
