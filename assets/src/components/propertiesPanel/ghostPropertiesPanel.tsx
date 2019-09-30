import React, { useContext } from "react"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { Ghost } from "../../realtime"
import { Route } from "../../schedule"
import { deselectVehicle } from "../../state"
import CloseButton from "./closeButton"
import Header from "./header"
import PropertiesList from "./propertiesList"

interface Props {
  selectedGhost: Ghost
  route?: Route
}

const properties = () => [
  {
    label: "Run",
    value: "Not Available",
  },
]

const GhostPropertiesPanel = ({ selectedGhost, route }: Props) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const hideMe = () => dispatch(deselectVehicle())

  return (
    <div className="m-ghost-properties-panel">
      <Header vehicle={selectedGhost} route={route} />

      <PropertiesList properties={properties()} />

      <CloseButton onClick={hideMe} />
    </div>
  )
}

export default GhostPropertiesPanel
