import React, { useContext } from "react"
import { createPreset, instantiatePreset, savePreset } from "../state"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { currentRouteTab, isPreset, isEditedPreset } from "../models/routeTab"

const Presets = () => {
  const [{ routeTabs }, dispatch] = useContext(StateDispatchContext)
  const presets = routeTabs.filter(isPreset)

  return (
    <div className="m-presets-panel">
      <div>
        Existing presets:
        <ul>
          {presets.map((preset) => (
            <button
              key={preset.uuid}
              onClick={() => dispatch(instantiatePreset(preset.uuid))}
            >
              {preset.presetName}
            </button>
          ))}
        </ul>
      </div>
      <button
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
        Save as preset
      </button>
    </div>
  )
}

export default Presets
