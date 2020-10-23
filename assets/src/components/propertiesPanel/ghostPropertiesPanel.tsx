import React, { useState } from "react"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Ghost } from "../../realtime"
import IconAlertCircle, { AlertIconStyle } from "../iconAlertCircle"
import PropertiesList, { ghostProperties } from "../propertiesList"
import BlockWaiverList from "./blockWaiverList"
import Header from "./header"
import TabPanels, { TabMode } from "./tabPanels"

interface Props {
  selectedGhost: Ghost
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

const StatusContent = ({ ghost }: { ghost: Ghost }) => (
  <>
    {hasBlockWaiver(ghost) ? (
      <BlockWaiverList blockWaivers={ghost.blockWaivers} />
    ) : (
      <NoWaiverBanner />
    )}

    <PropertiesList properties={ghostProperties(ghost)} />
  </>
)

const GhostPropertiesPanel = ({ selectedGhost }: Props) => {
  const [tabMode, setTabMode] = useState<TabMode>("status")

  return (
    <div className="m-ghost-properties-panel">
      <Header
        vehicle={selectedGhost}
        tabMode={tabMode}
        setTabMode={setTabMode}
      />

      <TabPanels
        vehicleOrGhost={selectedGhost}
        statusContent={<StatusContent ghost={selectedGhost} />}
        mode={tabMode}
      />
    </div>
  )
}

export default GhostPropertiesPanel
