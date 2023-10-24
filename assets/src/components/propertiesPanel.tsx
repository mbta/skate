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
  onClosePanel: () => void
}

export type IndividualPropertiesPanelProps = {
  tabMode: TabMode
  onChangeTabMode: React.Dispatch<React.SetStateAction<TabMode>>
  onClosePanel: () => void
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
  onClosePanel,
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
            onChangeTabMode={setTabMode}
            onClosePanel={onClosePanel}
          />
        ) : isVehicle(mostRecentVehicle) ? (
          <VehiclePropertiesPanel
            selectedVehicle={mostRecentVehicle}
            tabMode={tabMode}
            onChangeTabMode={setTabMode}
            onClosePanel={onClosePanel}
          />
        ) : (
          <GhostPropertiesPanel
            selectedGhost={mostRecentVehicle}
            tabMode={tabMode}
            onChangeTabMode={setTabMode}
            onClosePanel={onClosePanel}
          />
        )}
      </div>
      <div
        className="c-properties-panel-backdrop"
        onClick={
          /* istanbul ignore next */
          () => hideMeIfNoCrowdingTooltip(onClosePanel)
        }
        aria-hidden={true}
      />
    </>
  )
}

export default PropertiesPanel
