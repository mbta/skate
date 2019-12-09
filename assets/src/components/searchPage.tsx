import { Socket } from "phoenix"
import React, { ReactElement, useContext, useState } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { Search } from "../models/search"
import { isVehicle } from "../models/vehicle"
import { Vehicle, VehicleId, VehicleOrGhost } from "../realtime"
import Map from "./map"
import PropertiesPanel from "./propertiesPanel"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"
import SearchResults from "./searchResults"

enum MobileDisplay {
  List = 1,
  Map,
}

const thereIsAnActiveSearch = (
  vehicles: VehicleOrGhost[] | null | undefined,
  search: Search
): boolean => vehicles !== null && vehicles !== undefined && search.isActive

const filterVehicles = (
  vehiclesOrGhosts: VehicleOrGhost[] | null | undefined
): Vehicle[] => {
  if (vehiclesOrGhosts === null || vehiclesOrGhosts === undefined) {
    return []
  }

  return vehiclesOrGhosts.filter(vog => isVehicle(vog)) as Vehicle[]
}

const findSelectedVehicle = (
  vehicles: VehicleOrGhost[],
  selectedVehicleId: VehicleId | undefined
): VehicleOrGhost | undefined =>
  vehicles.find(vehicle => vehicle.id === selectedVehicleId)

const ToggleMobileDisplayButton = ({
  mobileDisplay,
  onToggleMobileDisplay,
}: {
  mobileDisplay: MobileDisplay
  onToggleMobileDisplay: () => void
}) => {
  const otherDisplayName = mobileDisplay === MobileDisplay.List ? "map" : "list"

  return (
    <button
      className="m-search-page__toggle-mobile-display-button"
      onClick={onToggleMobileDisplay}
    >
      Show {otherDisplayName} instead
    </button>
  )
}

const SearchPage = (): ReactElement<HTMLDivElement> => {
  const [{ search, selectedVehicleId }] = useContext(StateDispatchContext)
  const socket: Socket | undefined = useContext(SocketContext)
  const vehicles: VehicleOrGhost[] | null | undefined = useSearchResults(
    socket,
    search
  )
  const onlyVehicles: Vehicle[] = filterVehicles(vehicles)
  const [mobileDisplay, setMobileDisplay] = useState(MobileDisplay.List)

  const toggleMobileDisplay = () => {
    setMobileDisplay(
      mobileDisplay === MobileDisplay.List
        ? MobileDisplay.Map
        : MobileDisplay.List
    )
  }

  const mobileDisplayClass =
    mobileDisplay === MobileDisplay.List
      ? "m-search-page--show-list"
      : "m-search-page--show-map"

  const selectedVehicle: VehicleOrGhost | undefined = findSelectedVehicle(
    vehicles || [],
    selectedVehicleId
  )

  return (
    <div className={`c-page m-search-page ${mobileDisplayClass}`}>
      <div className="m-search-page__input-and-results">
        <div className="m-search-page__input">
          <SearchForm />

          <ToggleMobileDisplayButton
            mobileDisplay={mobileDisplay}
            onToggleMobileDisplay={toggleMobileDisplay}
          />
        </div>

        <div className="m-search-display">
          {thereIsAnActiveSearch(vehicles, search) ? (
            <SearchResults vehicles={vehicles as VehicleOrGhost[]} />
          ) : (
            <RecentSearches />
          )}
        </div>
      </div>

      <div className="m-search-page__map">
        <Map vehicles={onlyVehicles} />
      </div>

      {selectedVehicle && (
        <PropertiesPanel selectedVehicleOrGhost={selectedVehicle} />
      )}
    </div>
  )
}

export default SearchPage
