import React, { Dispatch, SetStateAction, useContext, useState } from "react"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Vehicle } from "../../realtime"
import BlockWaiverList from "./blockWaiverList"
import TabPanels, { TabMode } from "./tabPanels"
import { Card, CardBody } from "../card"
import VehicleIcon, { Orientation, Size } from "../vehicleIcon"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { deselectVehicle } from "../../state"
import { runOrBusNumberLabel } from "../../helpers/vehicleLabel"
import OldCloseButton from "../oldCloseButton"
import TabList from "./tabList"

interface Props {
  selectedVehicle: Vehicle
}

const StaleDataPropertiesPanel: React.FC<Props> = ({ selectedVehicle }) => {
  const [tabMode, setTabMode] = useState<TabMode>("status")

  return (
    <div className="m-stale-data-properties-panel">
      <StaleDataHeader
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

const StaleDataHeader: React.FC<{
  vehicle: Vehicle
  tabMode: TabMode
  setTabMode: Dispatch<SetStateAction<TabMode>>
}> = ({ vehicle, tabMode, setTabMode }) => {
  const [{ userSettings }, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <div className="m-properties-panel__header-wrapper">
      <div className="m-properties-panel__header">
        <div className="m-properties-panel__label">
          <VehicleIcon
            size={Size.Large}
            orientation={Orientation.Up}
            label={runOrBusNumberLabel(vehicle, userSettings)}
            variant={vehicle.viaVariant}
            status={"plain"}
            userSettings={userSettings}
          />
        </div>
        <div className="m-properties-panel__variant">
          <div className="m-properties-panel__inbound-outbound">N/A</div>
          <div className="m-route-variant-name">Not Available</div>
        </div>
        <div className="m-properties-panel__close-ping">
          <OldCloseButton onClick={hideMe} />
        </div>
      </div>
      {vehicle.isShuttle || (
        <TabList activeTab={tabMode} setActiveTab={setTabMode} />
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
