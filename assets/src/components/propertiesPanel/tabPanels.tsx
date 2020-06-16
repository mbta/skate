import React from "react"
import { VehicleOrGhost } from "../../realtime"
import { MinischeduleBlock, MinischeduleRun } from "./minischedule"

export type TabMode = "status" | "run" | "block"

interface Props {
  vehicleOrGhost: VehicleOrGhost
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
  <div className="m-tabs">
    <div className="m-tabs__tab-panel m-tabs__tab-panel--selected">
      {activePanelContent(props)}
    </div>
  </div>
)

export default TabPanels
