import React, { Dispatch, SetStateAction, useContext } from "react"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Vehicle } from "../../realtime"
import BlockWaiverList from "./blockWaiverList"
import TabPanels, { TabMode } from "./tabPanels"
import { Card, CardBody } from "../card"
import VehicleIcon, { Orientation, Size } from "../vehicleIcon"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { returnToPreviousView } from "../../state"
import { runOrBusNumberLabel } from "../../helpers/vehicleLabel"
import TabList from "./tabList"
import ViewHeader from "../viewHeader"
import { isVehicleInScheduledService } from "../../models/vehicle"
import { IndividualPropertiesPanelProps } from "../propertiesPanel"

type Props = {
  selectedVehicle: Vehicle
} & IndividualPropertiesPanelProps

const StaleDataPropertiesPanel: React.FC<Props> = ({
  selectedVehicle,
  tabMode,
  setTabMode,
  closePanel,
}) => {
  return (
    <div className="c-stale-data-properties-panel">
      <StaleDataHeader
        vehicle={selectedVehicle}
        tabMode={tabMode}
        setTabMode={setTabMode}
        closePanel={closePanel}
      />
      {isVehicleInScheduledService(selectedVehicle) ? (
        <TabPanels
          vehicleOrGhost={selectedVehicle}
          statusContent={<StaleContent selectedVehicle={selectedVehicle} />}
          mode={tabMode}
        />
      ) : (
        <StaleContent selectedVehicle={selectedVehicle} />
      )}
    </div>
  )
}

const StaleDataHeader: React.FC<{
  vehicle: Vehicle
  tabMode: TabMode
  setTabMode: Dispatch<SetStateAction<TabMode>>
  closePanel: () => void
}> = ({ vehicle, tabMode, setTabMode, closePanel }) => {
  const [{ userSettings, previousView }, dispatch] =
    useContext(StateDispatchContext)

  return (
    <div className="c-properties-panel__header-wrapper">
      <ViewHeader
        title="Vehicles"
        closeView={closePanel}
        backlinkToView={previousView}
        followBacklink={() => dispatch(returnToPreviousView())}
      />
      <div className="c-properties-panel__header">
        <div className="c-properties-panel__label">
          <VehicleIcon
            size={Size.Large}
            orientation={Orientation.Up}
            label={runOrBusNumberLabel(vehicle, userSettings)}
            variant={vehicle.viaVariant}
            status={"plain"}
            userSettings={userSettings}
          />
        </div>
        <div className="c-properties-panel__variant">
          <div className="c-properties-panel__inbound-outbound">N/A</div>
          <div className="c-route-variant-name">Not Available</div>
        </div>
      </div>
      {vehicle.isShuttle || (
        <TabList activeTab={tabMode} setActiveTab={setTabMode} />
      )}
    </div>
  )
}

const StaleContent: React.FC<{
  selectedVehicle: Vehicle
}> = ({ selectedVehicle }: { selectedVehicle: Vehicle }) => (
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
