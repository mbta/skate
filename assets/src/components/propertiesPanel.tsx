import React, { useEffect, useState } from "react"
import useSocket from "../hooks/useSocket"
import useVehicleForId from "../hooks/useVehicleForId"
import { isLoggedOut, isVehicle } from "../models/vehicle"
import { Ghost, Vehicle } from "../realtime.d"
import GhostPropertiesPanel from "./propertiesPanel/ghostPropertiesPanel"
import StaleDataPropertiesPanel from "./propertiesPanel/staleDataPropertiesPanel"
import VehiclePropertiesPanel from "./propertiesPanel/vehiclePropertiesPanel"
import { TabMode } from "./propertiesPanel/tabPanels"

interface Props extends IndividualPropertiesPanelProps {
  selectedVehicleOrGhost: Vehicle | Ghost
}

export type IndividualPropertiesPanelProps = {
  tabMode: TabMode
  onChangeTabMode: (tabMode: TabMode) => void
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
  tabMode,
  onChangeTabMode,
  onClosePanel,
}: Props) => {
  const { socket } = useSocket()
  const liveVehicle = useVehicleForId(socket, selectedVehicleOrGhost.id)
  const [mostRecentVehicle, setMostRecentVehicle] = useState<Vehicle | Ghost>(
    liveVehicle || selectedVehicleOrGhost
  )

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
            onChangeTabMode={onChangeTabMode}
            onClosePanel={onClosePanel}
          />
        ) : isVehicle(mostRecentVehicle) ? (
          <VehiclePropertiesPanel
            selectedVehicle={mostRecentVehicle}
            tabMode={tabMode}
            onChangeTabMode={onChangeTabMode}
            onClosePanel={onClosePanel}
          />
        ) : (
          <GhostPropertiesPanel
            selectedGhost={mostRecentVehicle}
            tabMode={tabMode}
            onChangeTabMode={onChangeTabMode}
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

interface PropertiesPanelWithTabsStateProps extends Props {
  initialTab?: TabMode
}

const PropertiesPanelWithTabState = ({
  initialTab = "status",
  ...props
}: Omit<PropertiesPanelWithTabsStateProps, "tabMode" | "onChangeTabMode">) => {
  const [tabMode, setTabMode] = useState<TabMode>(initialTab)

  return (
    <PropertiesPanel
      {...props}
      tabMode={tabMode}
      onChangeTabMode={setTabMode}
    />
  )
}

PropertiesPanel.WithTabState = PropertiesPanelWithTabState

export default PropertiesPanel
