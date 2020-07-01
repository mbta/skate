import React, { useContext, useEffect } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import detectSwipe, { SwipeDirection } from "../helpers/detectSwipe"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime.d"
import { Route } from "../schedule"
import { deselectVehicle } from "../state"
import CloseButton from "./propertiesPanel/closeButton"
import GhostPropertiesPanel from "./propertiesPanel/ghostPropertiesPanel"
import VehiclePropertiesPanel from "./propertiesPanel/vehiclePropertiesPanel"

interface Props {
  selectedVehicleOrGhost: VehicleOrGhost
  route?: Route
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

export const hideMeIfNoCrowdingTooltip = (hideMe: () => void) => {
  const noTooltipOpen =
    document.getElementsByClassName("m-crowding-diagram__crowding-tooltip show")
      .length === 0
  if (noTooltipOpen) {
    hideMe()
  }
}

const PropertiesPanel = ({ selectedVehicleOrGhost, route }: Props) => {
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

        <CloseButton />
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
