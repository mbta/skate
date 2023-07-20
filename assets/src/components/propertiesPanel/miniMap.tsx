import { DomEvent } from "leaflet"
import React, { useCallback, useContext } from "react"
import { Link } from "react-router-dom"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { useStations } from "../../hooks/useStations"
import { VehicleInScheduledService, VehicleId, Vehicle } from "../../realtime"
import { Shape, Stop } from "../../schedule"
import {
  SelectedEntityType,
  newSearchSession,
} from "../../state/searchPageState"
import inTestGroup, { TestGroups } from "../../userInTestGroup"
import { mapModeForUser } from "../../util/mapMode"
import { MapFollowingPrimaryVehicles } from "../map"

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
      className="c-vehicle-properties-panel__map-open-link leaflet-bar"
      to={mapModeForUser().path}
      onClick={() => {
        window.FS?.event("Map opened from VPP mini map")
        dispatch(
          newSearchSession({
            type: SelectedEntityType.Vehicle,
            vehicleId: vehicleId,
          })
        )
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
  routeVehicles: VehicleInScheduledService[]
}) => {
  const stations: Stop[] | null = useStations()

  const inMapBetaGroup = inTestGroup(TestGroups.MapBeta)

  return (
    <MapFollowingPrimaryVehicles
      selectedVehicleId={vehicle.id}
      vehicles={[vehicle]}
      shapes={shapes}
      secondaryVehicles={routeVehicles}
      stations={stations}
      allowFullscreen={!inMapBetaGroup}
    >
      <>{inMapBetaGroup && <SearchMapLink vehicleId={vehicle.id} />}</>
    </MapFollowingPrimaryVehicles>
  )
}

export default MiniMap
