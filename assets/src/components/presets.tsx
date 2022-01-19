import React, { useContext } from "react"
import { createPreset, instantiatePreset } from "../state"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { currentRouteTab, isPreset } from "../models/routeTab"

const Presets = () => {
  const [{ routeTabs }, dispatch] = useContext(StateDispatchContext)
  const presets = routeTabs.filter(isPreset)

  return (
    <div>
      <button
        onClick={() =>
          dispatch(
            createPreset(
              currentRouteTab(routeTabs).uuid,
              `Preset ${Math.floor(Math.random() * 10000)}`
            )
          )
        }
      >
        Save as preset
      </button>
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
    </div>
  )
}

export default Presets
