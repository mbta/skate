import React, { useContext } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { className } from "../helpers/dom"
import { isRecentlyLoggedOn, isVehicle } from "../models/vehicle"
import { Vehicle, VehicleOrGhost } from "../realtime"
import { selectVehicle } from "../state"
import { setSearchText } from "../state/searchPageState"
import PropertiesList from "./propertiesList"
import { RouteVariantName } from "./routeVariantName"

interface Props {
  vehicles: VehicleOrGhost[]
}

const SearchResultsNote = () => (
  <p className="m-search-results__note">
    Please note that at this time search is limited to active vehicles and
    logged-in personnel.
  </p>
)

const NewBadge = () => (
  <div className="m-search-results__card-new-badge">
    <span className="m-search-results__card-new-badge-label">New</span>
    <span className="m-search-results__card-new-badge-icon">
      <svg viewBox="0 0 9 9" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4.5" cy="4.5" r="4.5" />
      </svg>
    </span>
  </div>
)

const RouteLabel = ({ vehicle }: { vehicle: Vehicle }) => (
  <div className="m-search-results__card-route-label">
    <RouteVariantName vehicle={vehicle} />
  </div>
)

const SearchResultCard = ({
  vehicleOrGhost,
}: {
  vehicleOrGhost: VehicleOrGhost
}) => {
  const [
    {
      searchPageState: { query },
      selectedVehicleId,
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  const classes = [
    "m-search-results__card",
    vehicleOrGhost.id === selectedVehicleId
      ? "m-search-results__card--selected"
      : "",
    isRecentlyLoggedOn(vehicleOrGhost) ? "m-search-results__card--new" : "",
  ]

  const selectVehicleOrGhost = () => dispatch(selectVehicle(vehicleOrGhost.id))

  return (
    <div className={className(classes)} onClick={selectVehicleOrGhost}>
      {isRecentlyLoggedOn(vehicleOrGhost) && <NewBadge />}

      <PropertiesList
        vehicleOrGhost={vehicleOrGhost}
        highlightText={query.text}
      />

      {isVehicle(vehicleOrGhost) && <RouteLabel vehicle={vehicleOrGhost} />}
    </div>
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

const ResultsList = ({ vehicles }: { vehicles: VehicleOrGhost[] }) => (
  <div className="m-search-results__list">
    {vehicles.sort(byOperatorLogonTime).map((vehicleOrGhost) => (
      <SearchResultCard
        vehicleOrGhost={vehicleOrGhost}
        key={`search-result-card-${vehicleOrGhost.id}`}
      />
    ))}
    <SearchResultsNote />
  </div>
)

const NoResults = () => {
  const [
    {
      searchPageState: { query },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  return (
    <div className="m-search-results__none">
      <div className="m-search-results__heading">No Search Results</div>

      <p>
        There were no matching results found for “{query.text}”. Please try
        again using numbers or last names only.
      </p>

      <SearchResultsNote />

      <button
        className="m-search-results__clear-search-button"
        onClick={() => dispatch(setSearchText(""))}
      >
        Clear search
      </button>
    </div>
  )
}

const SearchResults = ({ vehicles }: Props) => (
  <div className="m-search-results">
    {vehicles.length ? <ResultsList vehicles={vehicles} /> : <NoResults />}
  </div>
)

export default SearchResults
