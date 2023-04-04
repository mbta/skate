import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isVehicle } from "../models/vehicle"
import { VehicleOrGhost } from "../realtime"
import { setSearchText } from "../state/searchPageState"
import { Card, CardProperties } from "./card"
import { vehicleOrGhostProperties } from "./propertiesList"
import { RouteVariantName } from "./routeVariantName"
import { VehicleStatusIcon } from "./vehicleRouteSummary"

interface Props {
  vehicles: VehicleOrGhost[]
  onClick: (vehicle: VehicleOrGhost) => void
  selectedVehicleId: string | null
}

const SearchResultCard = ({
  vehicleOrGhost,
  onClick,
  isSelected,
}: {
  vehicleOrGhost: VehicleOrGhost
  onClick: (vehicle: VehicleOrGhost) => void
  isSelected: boolean
}) => {
  const [
    {
      searchPageState: { query },
    },
  ] = useContext(StateDispatchContext)

  return (
    <li>
      <Card
        openCallback={() => onClick(vehicleOrGhost)}
        style="white"
        title={<RouteVariantName vehicle={vehicleOrGhost} />}
        icon={<VehicleStatusIcon vehicle={vehicleOrGhost} />}
        additionalClass="c-search-results__result"
        selected={isSelected}
      >
        <CardProperties
          properties={vehicleOrGhostProperties(vehicleOrGhost, true)}
          highlightText={query.text}
        />
      </Card>
    </li>
  )
}

const operatorLogonTimeForSorting = (
  vehicleOrGhost: VehicleOrGhost
): Date | undefined =>
  isVehicle(vehicleOrGhost) && vehicleOrGhost.operatorLogonTime !== null
    ? vehicleOrGhost.operatorLogonTime
    : undefined

export const byOperatorLogonTime = (
  a: VehicleOrGhost,
  b: VehicleOrGhost
): number => {
  const operatorLogonTimeA = operatorLogonTimeForSorting(a)
  const operatorLogonTimeB = operatorLogonTimeForSorting(b)

  // Sort ghosts or vehicles without logon times to the top
  if (!operatorLogonTimeA && !operatorLogonTimeB) {
    return 0
  }
  if (!operatorLogonTimeA) {
    return -1
  }
  if (!operatorLogonTimeB) {
    return 1
  }

  if (operatorLogonTimeA > operatorLogonTimeB) {
    return -1
  }
  if (operatorLogonTimeB > operatorLogonTimeA) {
    return 1
  }
  return 0
}

const ResultsList = ({
  vehicles,
  onClick,
  selectedVehicleId,
}: {
  vehicles: VehicleOrGhost[]
  onClick: (vehicle: VehicleOrGhost) => void
  selectedVehicleId: string | null
}) => (
  <ul className="c-search-results__list">
    {vehicles.sort(byOperatorLogonTime).map((vehicleOrGhost) => (
      <SearchResultCard
        vehicleOrGhost={vehicleOrGhost}
        onClick={() => onClick(vehicleOrGhost)}
        isSelected={
          selectedVehicleId ? selectedVehicleId === vehicleOrGhost.id : false
        }
        key={`search-result-card-${vehicleOrGhost.id}`}
      />
    ))}
  </ul>
)

const NoResults = () => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  return (
    <div className="c-search-results__none">
      <div className="c-search-results__heading">No Search Results</div>

      <p>
        There were no matching results found for “{query.text}”. Please try
        again using numbers or last names only.
      </p>

      <p>
        Please note that at this time search is limited to active vehicles and
        logged-in personnel.
      </p>

      <button
        className="c-search-results__clear-search-button"
        onClick={() => dispatch(setSearchText(""))}
      >
        Clear search
      </button>
    </div>
  )
}

const SearchResults = ({ vehicles, onClick, selectedVehicleId }: Props) => {
  return (
    <div className="c-search-results">
      {vehicles.length ? (
        <ResultsList
          vehicles={vehicles}
          onClick={onClick}
          selectedVehicleId={selectedVehicleId}
        />
      ) : (
        <NoResults />
      )}
    </div>
  )
}

export default SearchResults
