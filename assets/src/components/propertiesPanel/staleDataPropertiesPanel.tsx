import React, { useState } from "react"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Vehicle } from "../../realtime"
import Header from "./header"
import BlockWaiverList from "./blockWaiverList"
import TabPanels, { TabMode } from "./tabPanels"
import { Card, CardBody } from "../card"

interface Props {
  selectedVehicle: Vehicle
}

const StaleDataPropertiesPanel: React.FC<Props> = ({ selectedVehicle }) => {
  const [tabMode, setTabMode] = useState<TabMode>("status")

  return (
    <div className="m-stale-data-properties-panel">
      <Header
        vehicle={selectedVehicle}
        tabMode={tabMode}
        setTabMode={setTabMode}
      />
      {selectedVehicle.isShuttle ? (
        <StaleContent selectedVehicle={selectedVehicle} />
      ) : (
        <TabPanels
          vehicleOrGhost={selectedVehicle}
          statusContent={<StaleContent selectedVehicle={selectedVehicle} />}
          mode={tabMode}
        />
      )}
    </div>
  )
}

const StaleContent: React.FC<{ selectedVehicle: Vehicle }> = ({
  selectedVehicle,
}: {
  selectedVehicle: Vehicle
}) => (
  <>
    {hasBlockWaiver(selectedVehicle) && (
      <BlockWaiverList blockWaivers={selectedVehicle.blockWaivers} />
    )}
    <Card
      title={`No active run on vehicle ${selectedVehicle.label}`}
      style="white"
      noFocusOrHover={true}
    >
      <CardBody>
        Status data is not available because run {selectedVehicle.runId} has
        logged out of vehicle {selectedVehicle.label}. If real-time data becomes
        available for vehicle {selectedVehicle.label}, it will be displayed
        here.
      </CardBody>
    </Card>
  </>
)

export default StaleDataPropertiesPanel
