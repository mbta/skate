import React, { useContext, useEffect, useState } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSocket from "../hooks/useSocket"
import useVehicleForId from "../hooks/useVehicleForId"
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
  const { socket } = useSocket()
  const liveVehicle = useVehicleForId(socket, selectedVehicleOrGhost.id)
  const [vehicleToDisplay, setVehicleToDisplay] = useState<VehicleOrGhost>(
    liveVehicle || selectedVehicleOrGhost
  )
  useEffect(() => {
    if (liveVehicle) {
      setVehicleToDisplay(liveVehicle)
    }
  }, [liveVehicle])

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <>
      <div id="m-properties-panel" className="m-properties-panel">
        {isVehicle(vehicleToDisplay) ? (
          <VehiclePropertiesPanel selectedVehicle={vehicleToDisplay} />
        ) : (
          <GhostPropertiesPanel selectedGhost={vehicleToDisplay} />
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
