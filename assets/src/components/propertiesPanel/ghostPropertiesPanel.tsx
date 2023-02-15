import React, { useState } from "react"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Ghost } from "../../realtime"
import PropertiesList, { ghostProperties } from "../propertiesList"
import { NoWaiverBanner } from "./blockWaiverBanner"
import BlockWaiverList from "./blockWaiverList"
import Header from "./header"
import TabPanels, { TabMode } from "./tabPanels"

interface Props {
  selectedGhost: Ghost
}

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
