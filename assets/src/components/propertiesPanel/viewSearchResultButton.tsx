import React, { useContext } from "react"
import { useHistory } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { ladderIcon, mapIcon } from "../../helpers/icon"
import { isGhost, isShuttle } from "../../models/vehicle"
import { Vehicle, VehicleOrGhost } from "../../realtime"
import {
  deselectVehicle,
  ensureShuttleRunSelected,
  selectRoute,
} from "../../state"

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
    <button className="m-view-search-result-button" onClick={viewOnRouteLadder}>
      {ladderIcon("m-view-search-result-button__icon")}
      View on Route Ladder
    </button>
  )
}

const ViewOnShuttleMapButton = ({
  selectedVehicle,
}: {
  selectedVehicle: Vehicle
}) => {
  const history = useHistory()
  const [, dispatch] = useContext(StateDispatchContext)

  const viewOnShuttleMap = () => {
    if (selectedVehicle.runId !== null) {
      dispatch(ensureShuttleRunSelected(selectedVehicle.runId))
    }
    dispatch(deselectVehicle())
    history.push("/shuttle-map")
  }

  return (
    <button className="m-view-search-result-button" onClick={viewOnShuttleMap}>
      {mapIcon("m-view-search-result-button__icon")}
      View on Shuttle Map
    </button>
  )
}

const ViewSearchResultButton = ({ selectedVehicleOrGhost }: Props) =>
  isGhost(selectedVehicleOrGhost) || !isShuttle(selectedVehicleOrGhost) ? (
    <ViewOnRouteLadderButton selectedVehicleOrGhost={selectedVehicleOrGhost} />
  ) : (
    <ViewOnShuttleMapButton selectedVehicle={selectedVehicleOrGhost} />
  )

export default ViewSearchResultButton
