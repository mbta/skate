import React from "react"
import { Ghost } from "../../realtime"
import { Route } from "../../schedule"
import CloseButton from "./closeButton"
import Header from "./header"
import PropertiesList, { Property } from "./propertiesList"

interface Props {
  selectedGhost: Ghost
  route?: Route
}

const properties = (ghost: Ghost): Property[] => [
  {
    label: "Run",
    value: ghost.runId || "Not Available",
  },
]

const GhostPropertiesPanel = ({ selectedGhost, route }: Props) => (
  <div className="m-ghost-properties-panel">
    <Header vehicle={selectedGhost} route={route} />

    <PropertiesList properties={properties(selectedGhost)} />

    <CloseButton />
  </div>
)

export default GhostPropertiesPanel
