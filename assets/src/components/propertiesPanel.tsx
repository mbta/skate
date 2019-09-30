import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isAVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime.d"
import { Route } from "../schedule"
import { deselectVehicle } from "../state"
import GhostPropertiesPanel from "./ghostPropertiesPanel"
import VehiclePropertiesPanel from "./vehiclePropertiesPanel"

interface Props {
  selectedVehicleOrGhost: VehicleOrGhost
  selectedVehicleRoute?: Route
}

const PropertiesPanel = ({
  selectedVehicleOrGhost,
  selectedVehicleRoute,
}: Props) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <>
      <div className="m-properties-panel">
        {isAVehicle(selectedVehicleOrGhost) ? (
          <VehiclePropertiesPanel
            selectedVehicle={selectedVehicleOrGhost}
            selectedVehicleRoute={selectedVehicleRoute}
          />
        ) : (
          <GhostPropertiesPanel
            selectedGhost={selectedVehicleOrGhost}
            selectedGhostRoute={selectedVehicleRoute}
          />
        )}
      </div>
      <div className="m-properties-panel__modal-overlay" onClick={hideMe} />
    </>
  )
}

export default PropertiesPanel
