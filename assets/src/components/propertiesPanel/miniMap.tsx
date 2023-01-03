import { DomEvent } from "leaflet"
import React, { useContext, useEffect } from "react"
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
  const [_state, dispatch] = useContext(StateDispatchContext)
  const ref = React.useRef(null)

  useEffect(() => {
    DomEvent.disableClickPropagation(ref.current!)
  }, [])

  return (
    <Link
      ref={ref}
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
