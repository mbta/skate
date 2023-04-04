import { Socket } from "phoenix"
import React, { ReactElement, useContext, useState } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { useStations } from "../hooks/useStations"
import { filterVehicles } from "../models/vehicle"
import { Vehicle, VehicleOrGhost } from "../realtime"
import { Stop } from "../schedule"
import { selectVehicle } from "../state"
import { SearchPageState } from "../state/searchPageState"
import { MapFollowingPrimaryVehicles } from "./map"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"
import SearchResults from "./searchResults"

enum MobileDisplay {
  List = 1,
  Map,
}

const thereIsAnActiveSearch = (
  vehicles: VehicleOrGhost[] | null,
  searchPageState: SearchPageState
): boolean => vehicles !== null && searchPageState.isActive

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
      className="c-search-page__toggle-mobile-display-button"
      onClick={onToggleMobileDisplay}
    >
      Show {otherDisplayName} instead
    </button>
  )
}

const SearchPage = (): ReactElement<HTMLDivElement> => {
  const [
    { searchPageState, mobileMenuIsOpen, selectedVehicleOrGhost },
    dispatch,
  ] = useContext(StateDispatchContext)

  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const stations: Stop[] | null = useStations()

  const vehicles: VehicleOrGhost[] | null = useSearchResults(
    socket,
    searchPageState.isActive ? searchPageState.query : null
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
      ? "c-search-page--show-list"
      : "c-search-page--show-map"

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  return (
    <div
      className={`l-page c-search-page ${mobileDisplayClass} ${mobileMenuClass}`}
    >
      <div className="c-search-page__input-and-results">
        <div className="c-search-page__input">
          <SearchForm />

          <ToggleMobileDisplayButton
            mobileDisplay={mobileDisplay}
            onToggleMobileDisplay={toggleMobileDisplay}
          />
        </div>

        <div className="c-search-display">
          {vehicles != null &&
          thereIsAnActiveSearch(vehicles, searchPageState) ? (
            <SearchResults
              vehicles={vehicles}
              onClick={(vehicleOrGhost) => {
                dispatch(selectVehicle(vehicleOrGhost))
              }}
              selectedVehicleId={selectedVehicleOrGhost?.id || null}
            />
          ) : (
            <RecentSearches />
          )}
        </div>
      </div>

      <div className="c-search-page__map">
        <MapFollowingPrimaryVehicles
          selectedVehicleId={selectedVehicleOrGhost?.id}
          vehicles={onlyVehicles}
          onPrimaryVehicleSelect={(vehicle) => dispatch(selectVehicle(vehicle))}
          stations={stations}
        />
      </div>
    </div>
  )
}

export default SearchPage
