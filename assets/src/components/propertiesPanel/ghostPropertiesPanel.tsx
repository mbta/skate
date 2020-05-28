import React from "react"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Ghost } from "../../realtime"
import { Route } from "../../schedule"
import IconAlertCircle, { AlertIconStyle } from "../iconAlertCircle"
import PropertiesList from "../propertiesList"
import BlockWaiverList from "./blockWaiverList"
import Header from "./header"
import StatusRunBlockTabs from "./status_run_block_tabs"

interface Props {
  selectedGhost: Ghost
  route?: Route
}

const NoWaiverBanner = () => (
  <div className="m-ghost-properties-panel__no-waiver-banner">
    <div className="m-ghost-properties-panel__no-waiver-banner-header">
      <span className="m-ghost-properties-panel__no-waiver-banner-alert-icon">
        <IconAlertCircle style={AlertIconStyle.Highlighted} />
      </span>
      <div className="m-ghost-properties-panel__no-waiver-banner-title">
        Unknown Ghost Bus - No Dispatcher Note
      </div>
    </div>
    A ghost bus or dropped trip has been automatically detected on this route.
    Please follow up with dispatch as needed, if a Dispatcher Note is generated
    - it will appear here.
  </div>
)

const GhostPropertiesPanel = ({ selectedGhost, route }: Props) => (
  <div className="m-ghost-properties-panel">
    <Header vehicle={selectedGhost} route={route} />

    {hasBlockWaiver(selectedGhost) ? (
      <BlockWaiverList blockWaivers={selectedGhost.blockWaivers} />
    ) : (
      <NoWaiverBanner />
    )}

    <StatusRunBlockTabs
      vehicleOrGhost={selectedGhost}
      statusContent={<PropertiesList vehicleOrGhost={selectedGhost} />}
    />
  </div>
)

export default GhostPropertiesPanel
