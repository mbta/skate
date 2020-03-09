import React from "react"
import featureIsEnabled from "../../laboratoryFeatures"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Ghost } from "../../realtime"
import { Route } from "../../schedule"
import PropertiesList from "../propertiesList"
import BlockWaiverList from "./blockWaiverList"
import Header from "./header"
import IconAlertCircle from "../iconAlertCircle"
import { isLateVehicleIndicator } from "../../models/ghost"

interface Props {
  selectedGhost: Ghost
  route?: Route
}

const NoWaiverBanner = ({ ghost: { runId } }: { ghost: Ghost }) => (
  <div className="m-ghost-properties-panel__no-waiver-banner">
    <div className="m-ghost-properties-panel__no-waiver-banner-header">
      <span className="m-ghost-properties-panel__no-waiver-banner-alert-icon">
        <IconAlertCircle />
      </span>
      <div className="m-ghost-properties-panel__no-waiver-banner-title">
        Unknown Ghost Bus - No Dispatcher Note
      </div>
    </div>
    A ghost bus or dropped trip has been automatically detected on this route.
    Please follow up with dispatch about Run {runId || "Not Available"} as
    needed, if a Dispatcher Note is generated - it will appear here.
  </div>
)

const GhostPropertiesPanel = ({ selectedGhost, route }: Props) => (
  <div className="m-ghost-properties-panel">
    <Header vehicle={selectedGhost} route={route} />

    {featureIsEnabled("block_waivers") && hasBlockWaiver(selectedGhost) && (
      <BlockWaiverList blockWaivers={selectedGhost.blockWaivers} />
    )}

    {featureIsEnabled("block_waivers") &&
      !hasBlockWaiver(selectedGhost) &&
      !isLateVehicleIndicator(selectedGhost) && (
        <NoWaiverBanner ghost={selectedGhost} />
      )}

    <PropertiesList vehicleOrGhost={selectedGhost} />
  </div>
)

export default GhostPropertiesPanel
