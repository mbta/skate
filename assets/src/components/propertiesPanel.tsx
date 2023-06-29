import React, { useContext, useEffect, useState } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSocket from "../hooks/useSocket"
import useVehicleForId from "../hooks/useVehicleForId"
import { isVehicle } from "../models/vehicle"
import { Ghost, Vehicle } from "../realtime.d"
import { closeView } from "../state"
import GhostPropertiesPanel from "./propertiesPanel/ghostPropertiesPanel"
import StaleDataPropertiesPanel from "./propertiesPanel/staleDataPropertiesPanel"
import VehiclePropertiesPanel from "./propertiesPanel/vehiclePropertiesPanel"

interface Props {
  selectedVehicleOrGhost: Vehicle | Ghost
}

export const hideMeIfNoCrowdingTooltip = (hideMe: () => void) => {
  const noTooltipOpen =
    document.getElementsByClassName("c-crowding-diagram__crowding-tooltip")
      .length === 0
  if (noTooltipOpen) {
    hideMe()
  }
}

const PropertiesPanel = ({ selectedVehicleOrGhost }: Props) => {
  const [, dispatch] = useContext(StateDispatchContext)
  const { socket } = useSocket()
  const liveVehicle = useVehicleForId(socket, selectedVehicleOrGhost.id)
  const [vehicleToDisplay, setVehicleToDisplay] = useState<Vehicle | Ghost>(
    liveVehicle || selectedVehicleOrGhost
  )
  const [dataIsStale, setDataIsStale] = useState<boolean>(false)

  useEffect(() => {
    if (liveVehicle) {
      setVehicleToDisplay(liveVehicle)
    }

    if (liveVehicle === null) {
      setDataIsStale(true)
    } else {
      setDataIsStale(false)
    }
  }, [liveVehicle])

  const hideMe = () => dispatch(closeView())

  return (
    <>
      <div id="c-properties-panel" className="c-properties-panel">
        {dataIsStale && isVehicle(vehicleToDisplay) ? (
          <StaleDataPropertiesPanel selectedVehicle={vehicleToDisplay} />
        ) : isVehicle(vehicleToDisplay) ? (
          <VehiclePropertiesPanel selectedVehicle={vehicleToDisplay} />
        ) : (
          <GhostPropertiesPanel selectedGhost={vehicleToDisplay} />
        )}
      </div>
      <div
        className="c-properties-panel-backdrop"
        onClick={
          /* istanbul ignore next */
          () => hideMeIfNoCrowdingTooltip(hideMe)
        }
        aria-hidden={true}
      />
    </>
  )
}

export default PropertiesPanel
