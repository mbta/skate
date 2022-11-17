import { Socket } from "phoenix"
import React, { ReactElement, useContext, useState } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { useTripShape } from "../hooks/useShapes"
import { isVehicle } from "../models/vehicle"
import { Vehicle, VehicleOrGhost } from "../realtime"
import { SearchPageState } from "../state/searchPageState"
import Map from "./map"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"
import SearchResults from "./searchResults"
import VehicleCard from "./vehicleCard"

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
  return vehiclesOrGhosts === null ? [] : vehiclesOrGhosts.filter(isVehicle)
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
      className="m-map-page__toggle-mobile-display-button"
      onClick={onToggleMobileDisplay}
    >
      Show {otherDisplayName} instead
    </button>
  )
}

const MapPage = (): ReactElement<HTMLDivElement> => {
  const [{ searchPageState, mobileMenuIsOpen }] =
    useContext(StateDispatchContext)

  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const vehicles: VehicleOrGhost[] | null = useSearchResults(
    socket,
    searchPageState.isActive ? searchPageState.query : null
  )
  const onlyVehicles: Vehicle[] = filterVehicles(vehicles)
  const [mobileDisplay, setMobileDisplay] = useState(MobileDisplay.List)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOrGhost | null>(
    null
  )
  const selectedVehicleShapes = useTripShape(selectedVehicle?.tripId || null)
  const [showVehicleCard, setShowVehicleCard] = useState<boolean>(false)

  const onSearchCallback = () => {
    setSelectedVehicle(null)
  }

  const toggleMobileDisplay = () => {
    setMobileDisplay(
      mobileDisplay === MobileDisplay.List
        ? MobileDisplay.Map
        : MobileDisplay.List
    )
  }

  const selectVehicle = (vehicle: Vehicle): void => {
    setSelectedVehicle(vehicle)
    setShowVehicleCard(true)
  }

  const mobileDisplayClass =
    mobileDisplay === MobileDisplay.List
      ? "m-map-page--show-list"
      : "m-map-page--show-map"

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""
  return (
    <>
      <div
        className={`c-page m-map-page ${mobileDisplayClass} ${mobileMenuClass}`}
        data-testid="map-page"
      >
        <div className="m-map-page__input-and-results">
          <div className="m-map-page__input">
            <SearchForm
              onSubmit={onSearchCallback}
              onClear={onSearchCallback}
            />
            <ToggleMobileDisplayButton
              mobileDisplay={mobileDisplay}
              onToggleMobileDisplay={toggleMobileDisplay}
            />
          </div>

          <div className="m-search-display">
            {vehicles !== null &&
            thereIsAnActiveSearch(vehicles, searchPageState) ? (
              <SearchResults
                vehicles={vehicles}
                selectedVehicleId={selectedVehicle?.id || null}
                onClick={setSelectedVehicle}
              />
            ) : (
              <RecentSearches />
            )}
          </div>
        </div>

        <div className="m-map-page__map-container">
          {selectedVehicle && isVehicle(selectedVehicle) && showVehicleCard && (
            <div className="m-map-page__vehicle-card">
              <VehicleCard
                vehicle={selectedVehicle}
                onClose={() => setShowVehicleCard(false)}
              />
            </div>
          )}

          <div className="m-map-page__map">
            <Map
              vehicles={onlyVehicles}
              onPrimaryVehicleSelect={selectVehicle}
              shapes={selectedVehicleShapes}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default MapPage
