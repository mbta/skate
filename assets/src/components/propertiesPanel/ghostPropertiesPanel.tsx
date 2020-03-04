import React from "react"
import featureIsEnabled from "../../laboratoryFeatures"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Ghost } from "../../realtime"
import { Route } from "../../schedule"
import PropertiesList from "../propertiesList"
import BlockWaiverList from "./blockWaiverList"
import Header from "./header"

interface Props {
  selectedGhost: Ghost
  route?: Route
}

const GhostPropertiesPanel = ({ selectedGhost, route }: Props) => (
  <div className="m-ghost-properties-panel">
    <Header vehicle={selectedGhost} route={route} />

    {featureIsEnabled("block_waivers") && hasBlockWaiver(selectedGhost) && (
      <BlockWaiverList blockWaivers={selectedGhost.blockWaivers} />
    )}

    <PropertiesList vehicleOrGhost={selectedGhost} />
  </div>
)

export default GhostPropertiesPanel
