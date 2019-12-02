import React, { useContext } from "react"
import { useHistory } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { ladderIcon, mapIcon } from "../../helpers/icon"
import { isGhost, isShuttle } from "../../models/vehicle"
import { VehicleOrGhost } from "../../realtime"
import { deselectVehicle, selectRoute } from "../../state"

interface Props {
  selectedVehicleOrGhost: VehicleOrGhost
}

const ViewOnRouteLadderButton = ({
  selectedVehicleOrGhost,
}: {
  selectedVehicleOrGhost: VehicleOrGhost
}) => {
  const history = useHistory()
  const [, dispatch] = useContext(StateDispatchContext)

  const viewOnRouteLadder = () => {
    dispatch(selectRoute(selectedVehicleOrGhost.routeId))
    dispatch(deselectVehicle())
    history.push("/")
  }

  return (
    <button
      className="m-properties-panel__navigate-button"
      onClick={viewOnRouteLadder}
    >
      {ladderIcon("m-properties-panel__navigate-button-icon")}
      View on Route Ladder
    </button>
  )
}

const ViewOnShuttleMapButton = () => {
  const history = useHistory()
  const [, dispatch] = useContext(StateDispatchContext)

  const viewOnShuttleMap = () => {
    dispatch(deselectVehicle())
    history.push("/shuttle-map")
  }

  return (
    <button
      className="m-properties-panel__navigate-button"
      onClick={viewOnShuttleMap}
    >
      {mapIcon("m-properties-panel__navigate-button-icon")}
      View on Shuttle Map
    </button>
  )
}

const NavigateButton = ({ selectedVehicleOrGhost }: Props) =>
  isGhost(selectedVehicleOrGhost) || !isShuttle(selectedVehicleOrGhost) ? (
    <ViewOnRouteLadderButton selectedVehicleOrGhost={selectedVehicleOrGhost} />
  ) : (
    <ViewOnShuttleMapButton />
  )

export default NavigateButton
