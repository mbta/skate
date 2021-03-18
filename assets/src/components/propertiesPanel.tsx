import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime.d"
import { deselectVehicle } from "../state"
import GhostPropertiesPanel from "./propertiesPanel/ghostPropertiesPanel"
import VehiclePropertiesPanel from "./propertiesPanel/vehiclePropertiesPanel"

interface Props {
  selectedVehicleOrGhost: VehicleOrGhost
}

export const hideMeIfNoCrowdingTooltip = (hideMe: () => void) => {
  const noTooltipOpen =
    document.getElementsByClassName("m-crowding-diagram__crowding-tooltip")
      .length === 0
  if (noTooltipOpen) {
    hideMe()
  }
}

const PropertiesPanel = ({ selectedVehicleOrGhost }: Props) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <>
      <div id="m-properties-panel" className="m-properties-panel">
        {isVehicle(selectedVehicleOrGhost) ? (
          <VehiclePropertiesPanel selectedVehicle={selectedVehicleOrGhost} />
        ) : (
          <GhostPropertiesPanel selectedGhost={selectedVehicleOrGhost} />
        )}
      </div>
      <div
        className="m-properties-panel__modal-overlay"
        onClick={
          /* istanbul ignore next */
          () => hideMeIfNoCrowdingTooltip(hideMe)
        }
      />
    </>
  )
}

export default PropertiesPanel
