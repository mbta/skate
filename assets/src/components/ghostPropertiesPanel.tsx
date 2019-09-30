import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { Ghost } from "../realtime"
import { Route } from "../schedule"
import { deselectVehicle } from "../state"
import Header from "./propertiesPanel/header"

interface Props {
  selectedGhost: Ghost
  selectedGhostRoute?: Route
}

const Properties = () => {
  return (
    <div className="m-properties-panel__properties">
      <table>
        <tbody>
          <tr>
            <th className="m-properties-panel__property-label">Run</th>
            <td className="m-properties-panel__property-value">
              Not Available
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const GhostPropertiesPanel = ({ selectedGhost, selectedGhostRoute }: Props) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <div className="m-ghost-properties-panel">
      <Header
        vehicle={selectedGhost}
        selectedVehicleRoute={selectedGhostRoute}
        shouldShowHeadwayDiagram={false}
      />

      <Properties />

      <button className="m-properties-panel__close" onClick={hideMe}>
        Close
      </button>
    </div>
  )
}

export default GhostPropertiesPanel
