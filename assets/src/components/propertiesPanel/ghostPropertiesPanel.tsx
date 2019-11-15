import React from "react"
import { Ghost } from "../../realtime"
import { Route } from "../../schedule"
import PropertiesList from "../propertiesList"
import CloseButton from "./closeButton"
import Header from "./header"

interface Props {
  selectedGhost: Ghost
  route?: Route
}

const GhostPropertiesPanel = ({ selectedGhost, route }: Props) => (
  <div className="m-ghost-properties-panel">
    <Header vehicle={selectedGhost} route={route} />

    <PropertiesList vehicleOrGhost={selectedGhost} />

    <CloseButton />
  </div>
)

export default GhostPropertiesPanel
