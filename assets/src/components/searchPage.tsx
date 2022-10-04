import { Socket } from "phoenix"
import React, { ReactElement, useContext, useState } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { useRouteShapes } from "../hooks/useShapes"
import { isVehicle } from "../models/vehicle"
import { Vehicle, VehicleOrGhost } from "../realtime"
import { SearchPageState } from "../state/searchPageState"
import Map from "./map"
import RecentSearches from "./recentSearches"
import RightPanel from "./rightPanel"
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

const filterVehicles = (
  vehiclesOrGhosts: VehicleOrGhost[] | null
): Vehicle[] => {
  return vehiclesOrGhosts === null
    ? []
    : (vehiclesOrGhosts.filter((vog) => isVehicle(vog)) as Vehicle[])
}

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
  const [{ searchPageState, selectedVehicleOrGhost, mobileMenuIsOpen }] =
    useContext(StateDispatchContext)
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const vehicles: VehicleOrGhost[] | null = useSearchResults(
    socket,
    searchPageState.isActive ? searchPageState.query : null
  )
  const onlyVehicles: Vehicle[] = filterVehicles(vehicles)
  const uniqueRoutes: string[] = Array.from(
    new Set(onlyVehicles.flatMap((v) => (v.routeId ? v.routeId : [])))
  )
  const routeIds = uniqueRoutes //uniqueRoutes.length > 0 ? uniqueRoutes : useRoutes()?.map((r) => r.id) || []
  const routeShapes = useRouteShapes(routeIds)
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

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  return (
    <div
      className={`c-page m-search-page ${mobileDisplayClass} ${mobileMenuClass}`}
    >
      <div className="m-search-page__input-and-results">
        <div className="m-search-page__input">
          <SearchForm />

          <ToggleMobileDisplayButton
            mobileDisplay={mobileDisplay}
            onToggleMobileDisplay={toggleMobileDisplay}
          />
        </div>

        <div className="m-search-display">
          {thereIsAnActiveSearch(vehicles, searchPageState) ? (
            <SearchResults vehicles={vehicles as VehicleOrGhost[]} />
          ) : (
            <RecentSearches />
          )}
        </div>
      </div>

      <div className="m-search-page__map">
        <Map vehicles={onlyVehicles} shapes={routeShapes} />
      </div>

      <RightPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
    </div>
  )
}

export default SearchPage
