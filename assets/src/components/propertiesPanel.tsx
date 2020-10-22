import React, { useContext } from "react"
import { useRoute } from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime.d"
import { Route } from "../schedule"
import { deselectVehicle } from "../state"
import GhostPropertiesPanel from "./propertiesPanel/ghostPropertiesPanel"
import VehiclePropertiesPanel from "./propertiesPanel/vehiclePropertiesPanel"

interface Props {
  selectedVehicleOrGhost: VehicleOrGhost
}

export const hideMeIfNoCrowdingTooltip = (hideMe: () => void) => {
  const noTooltipOpen =
    document.getElementsByClassName("m-crowding-diagram__crowding-tooltip show")
      .length === 0
  if (noTooltipOpen) {
    hideMe()
  }
}

const PropertiesPanel = ({ selectedVehicleOrGhost }: Props) => {
  const route: Route | null = useRoute(selectedVehicleOrGhost.routeId)
  const [, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <>
      <div id="m-properties-panel" className="m-properties-panel">
        {isVehicle(selectedVehicleOrGhost) ? (
          <VehiclePropertiesPanel
            selectedVehicle={selectedVehicleOrGhost}
            route={route || undefined}
          />
        ) : (
          <GhostPropertiesPanel
            selectedGhost={selectedVehicleOrGhost}
            route={route || undefined}
          />
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
