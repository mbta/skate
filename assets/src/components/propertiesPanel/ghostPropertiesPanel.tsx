import React from "react"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { Ghost } from "../../realtime"
import PropertiesList, { ghostProperties } from "../propertiesList"
import { NoWaiverBanner } from "./blockWaiverBanner"
import BlockWaiverList from "./blockWaiverList"
import Header from "./header"
import TabPanels from "./tabPanels"
import { IndividualPropertiesPanelProps } from "../propertiesPanel"

type Props = {
  selectedGhost: Ghost
} & IndividualPropertiesPanelProps

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
  onChangeTabMode,
  onClosePanel,
}: Props) => {
  return (
    <div className="c-ghost-properties-panel">
      <Header
        vehicle={selectedGhost}
        tabMode={tabMode}
        setTabMode={onChangeTabMode}
        closePanel={onClosePanel}
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
