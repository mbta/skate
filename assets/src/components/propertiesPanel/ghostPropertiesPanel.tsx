import React from "react"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Ghost } from "../../realtime"
import PropertiesList, { ghostProperties } from "../propertiesList"
import { NoWaiverBanner } from "./blockWaiverBanner"
import BlockWaiverList from "./blockWaiverList"
import Header from "./header"
import TabPanels, { TabMode } from "./tabPanels"

interface Props {
  selectedGhost: Ghost
  tabMode: TabMode
  setTabMode: React.Dispatch<React.SetStateAction<TabMode>>
  closePanel: () => void
}

const StatusContent = ({ ghost }: { ghost: Ghost }) => (
  <>
    <div className="c-ghost-properties-panel__notes">
      {hasBlockWaiver(ghost) ? (
        <BlockWaiverList blockWaivers={ghost.blockWaivers} />
      ) : (
        <NoWaiverBanner />
      )}
    </div>
    <PropertiesList properties={ghostProperties(ghost)} />
  </>
)

const GhostPropertiesPanel = ({
  selectedGhost,
  tabMode,
  setTabMode,
  closePanel,
}: Props) => {
  return (
    <div className="c-ghost-properties-panel">
      <Header
        vehicle={selectedGhost}
        tabMode={tabMode}
        setTabMode={setTabMode}
        closePanel={closePanel}
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
