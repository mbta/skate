import React, { useContext, useEffect } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import detectSwipe, { SwipeDirection } from "../helpers/detectSwipe"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime.d"
import { Route } from "../schedule"
import { deselectVehicle } from "../state"
import CloseButton from "./propertiesPanel/closeButton"
import GhostPropertiesPanel from "./propertiesPanel/ghostPropertiesPanel"
import NavigateButton from "./propertiesPanel/navigateButton"
import VehiclePropertiesPanel from "./propertiesPanel/vehiclePropertiesPanel"

interface Props {
  selectedVehicleOrGhost: VehicleOrGhost
  route?: Route
  enableNavigation?: boolean
}

export const handleSwipe = (hideMe: () => void) => (
  swipeDirection: SwipeDirection,
  target: HTMLElement | null
) => {
  if (target && target.id === "id-vehicle-map") {
    return
  }

  if (swipeDirection === "Right") {
    hideMe()
  }
}

const PropertiesPanel = ({
  selectedVehicleOrGhost,
  route,
  enableNavigation,
}: Props) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  useEffect(() => {
    return detectSwipe("m-properties-panel", handleSwipe(hideMe))
  })

  return (
    <>
      <div id="m-properties-panel" className="m-properties-panel">
        {isVehicle(selectedVehicleOrGhost) ? (
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

        {enableNavigation ? (
          <NavigateButton selectedVehicleOrGhost={selectedVehicleOrGhost} />
        ) : (
          <CloseButton />
        )}
      </div>
      <div className="m-properties-panel__modal-overlay" onClick={hideMe} />
    </>
  )
}

export default PropertiesPanel
