import React, { useEffect, useState } from "react"
import useSocket from "../hooks/useSocket"
import useVehicleForId from "../hooks/useVehicleForId"
import { isLoggedOut, isVehicle } from "../models/vehicle"
import { Ghost, Vehicle } from "../realtime.d"
import GhostPropertiesPanel from "./propertiesPanel/ghostPropertiesPanel"
import StaleDataPropertiesPanel from "./propertiesPanel/staleDataPropertiesPanel"
import VehiclePropertiesPanel from "./propertiesPanel/vehiclePropertiesPanel"
import { TabMode } from "./propertiesPanel/tabPanels"

interface Props {
  selectedVehicleOrGhost: Vehicle | Ghost
  initialTab?: TabMode
  closePanel: () => void
}

export type IndividualPropertiesPanelProps = {
  tabMode: TabMode
  setTabMode: React.Dispatch<React.SetStateAction<TabMode>>
  closePanel: () => void
}

export const hideMeIfNoCrowdingTooltip = (hideMe: () => void) => {
  const noTooltipOpen =
    document.getElementsByClassName("c-crowding-diagram__crowding-tooltip")
      .length === 0
  if (noTooltipOpen) {
    hideMe()
  }
}

const PropertiesPanel = ({
  selectedVehicleOrGhost,
  initialTab = "status",
  closePanel,
}: Props) => {
  const { socket } = useSocket()
  const liveVehicle = useVehicleForId(socket, selectedVehicleOrGhost.id)
  const [mostRecentVehicle, setMostRecentVehicle] = useState<Vehicle | Ghost>(
    liveVehicle || selectedVehicleOrGhost
  )
  const [tabMode, setTabMode] = useState<TabMode>(initialTab)

  useEffect(() => {
    if (liveVehicle) {
      setMostRecentVehicle(liveVehicle)
    }
  }, [liveVehicle])

  return (
    <>
      <div id="c-properties-panel" className="c-properties-panel">
        {isVehicle(mostRecentVehicle) &&
        (liveVehicle === null || isLoggedOut(mostRecentVehicle)) ? (
          <StaleDataPropertiesPanel
            selectedVehicle={mostRecentVehicle}
            tabMode={tabMode}
            setTabMode={setTabMode}
            closePanel={closePanel}
          />
        ) : isVehicle(mostRecentVehicle) ? (
          <VehiclePropertiesPanel
            selectedVehicle={mostRecentVehicle}
            tabMode={tabMode}
            setTabMode={setTabMode}
            closePanel={closePanel}
          />
        ) : (
          <GhostPropertiesPanel
            selectedGhost={mostRecentVehicle}
            tabMode={tabMode}
            setTabMode={setTabMode}
            closePanel={closePanel}
          />
        )}
      </div>
      <div
        className="c-properties-panel-backdrop"
        onClick={
          /* istanbul ignore next */
          () => hideMeIfNoCrowdingTooltip(closePanel)
        }
        aria-hidden={true}
      />
    </>
  )
}

export default PropertiesPanel
