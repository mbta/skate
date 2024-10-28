import React from "react"
import { VehicleInScheduledService, Ghost } from "../../realtime"
import { MinischeduleBlock, MinischeduleRun } from "./minischedule"

export type TabMode = "status" | "run" | "block"

interface Props {
  vehicleOrGhost: VehicleInScheduledService | Ghost
  statusContent: JSX.Element
  mode: TabMode
}

const activePanelContent = ({ mode, statusContent, vehicleOrGhost }: Props) => {
  switch (mode) {
    case "status":
      return statusContent
    case "run":
      return <MinischeduleRun vehicleOrGhost={vehicleOrGhost} />
    case "block":
      return (
        vehicleOrGhost.tripId && (
          <MinischeduleBlock vehicleOrGhost={vehicleOrGhost} />
        )
      )
  }
}

const TabPanels = (props: Props) => (
  <div className="c-tabs__tab-panel">{activePanelContent(props)}</div>
)

export default TabPanels
