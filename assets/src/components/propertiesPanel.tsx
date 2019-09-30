import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isAVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime.d"
import { Route } from "../schedule"
import { deselectVehicle } from "../state"
import GhostPropertiesPanel from "./propertiesPanel/ghostPropertiesPanel"
import VehiclePropertiesPanel from "./propertiesPanel/vehiclePropertiesPanel"

interface Props {
  selectedVehicleOrGhost: VehicleOrGhost
  route?: Route
}

const PropertiesPanel = ({ selectedVehicleOrGhost, route }: Props) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <>
      <div className="m-properties-panel">
        {isAVehicle(selectedVehicleOrGhost) ? (
          <VehiclePropertiesPanel
            selectedVehicle={selectedVehicleOrGhost}
            route={route}
          />
        ) : (
          <GhostPropertiesPanel
            selectedGhost={selectedVehicleOrGhost}
            route={route}
          />
        )}
      </div>
      <div className="m-properties-panel__modal-overlay" onClick={hideMe} />
    </>
  )
}

export default PropertiesPanel
