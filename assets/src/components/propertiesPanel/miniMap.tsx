import { DomEvent } from "leaflet"
import React, { useCallback, useContext } from "react"
import { Link } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { useStations } from "../../hooks/useStations"
import { Vehicle, VehicleId } from "../../realtime"
import { Shape, Stop } from "../../schedule"
import { setSelectedVehicle } from "../../state/searchPageState"
import inTestGroup, { MAP_BETA_GROUP_NAME } from "../../userInTestGroup"
import { mapModeForUser } from "../../util/mapMode"
import Map from "../map"

const SearchMapLink = ({ vehicleId }: { vehicleId: VehicleId }) => {
  const [, dispatch] = useContext(StateDispatchContext)

  const openMapLinkRef = useCallback((node: HTMLAnchorElement | null) => {
    if (node) {
      DomEvent.disableClickPropagation(node)
    }
  }, [])

  return (
    <Link
      ref={openMapLinkRef}
      className="m-vehicle-properties-panel__map-open-link leaflet-bar"
      to={mapModeForUser().path}
      onClick={() => {
        dispatch(setSelectedVehicle(vehicleId))
      }}
    >
      Open Map
    </Link>
  )
}

const MiniMap = ({
  vehicle,
  shapes,
  routeVehicles,
}: {
  vehicle: Vehicle
  shapes: Shape[]
  routeVehicles: Vehicle[]
}) => {
  const stations: Stop[] | null = useStations()

  return inTestGroup(MAP_BETA_GROUP_NAME) ? (
    <Map
      selectedVehicleId={vehicle.id}
      vehicles={[vehicle]}
      shapes={shapes}
      secondaryVehicles={routeVehicles}
      stations={stations}
      allowFullscreen={false}
    >
      <SearchMapLink vehicleId={vehicle.id} />
    </Map>
  ) : (
    <Map
      selectedVehicleId={vehicle.id}
      vehicles={[vehicle]}
      shapes={shapes}
      secondaryVehicles={routeVehicles}
      stations={stations}
    />
  )
}

export default MiniMap
