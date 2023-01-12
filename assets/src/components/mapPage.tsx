import { Map as LeafletMap } from "leaflet"
import { Socket } from "phoenix"
import React, {
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { useTripShape } from "../hooks/useShapes"
import { useStations } from "../hooks/useStations"
import useVehicleForId from "../hooks/useVehicleForId"
import { isVehicle } from "../models/vehicle"
import { Vehicle, VehicleOrGhost } from "../realtime"
import { SearchPageState, setSelectedVehicle } from "../state/searchPageState"
import Map from "./map"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"
import SearchResults from "./searchResults"
import VehiclePropertiesCard from "./vehiclePropertiesCard"

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

const MapPageInternal = ({
  liveSelectedVehicle,
}: {
  liveSelectedVehicle: Vehicle | null
}) => {
  const [{ searchPageState, mobileMenuIsOpen }, dispatch] =
    useContext(StateDispatchContext)
  const stations = useStations()

  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const vehicles: VehicleOrGhost[] | null = useSearchResults(
    socket,
    searchPageState.isActive ? searchPageState.query : null
  )
  const onlyVehicles: Vehicle[] = filterVehicles(vehicles)
  const [mobileDisplay, setMobileDisplay] = useState(MobileDisplay.List)

  const [showVehicleCard, setShowVehicleCard] = useState<boolean>(
    searchPageState.selectedVehicleId ? true : false
  )
  const selectedVehicleShapes = useTripShape(
    liveSelectedVehicle?.tripId || null
  )

  const onSearchCallback = () => {
    dispatch(setSelectedVehicle(null))
  }

  const toggleMobileDisplay = () => {
    setMobileDisplay(
      mobileDisplay === MobileDisplay.List
        ? MobileDisplay.Map
        : MobileDisplay.List
    )
  }

  const selectVehicle = (vehicle: VehicleOrGhost): void => {
    if (isVehicle(vehicle)) {
      dispatch(setSelectedVehicle(vehicle.id))
      setShowVehicleCard(true)
    }
  }

  const mobileDisplayClass =
    mobileDisplay === MobileDisplay.List
      ? "m-map-page--show-list"
      : "m-map-page--show-map"

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""
  const vpcEnabled = liveSelectedVehicle && showVehicleCard

  const leafletMap = useRef<LeafletMap | null>(null)
  useEffect(() => {
    // Let leaflet know when Page resizes due to vpc state
    leafletMap.current?.invalidateSize()
  }, [vpcEnabled])
  return (
    <div
      className={`m-map-page ${mobileDisplayClass} ${mobileMenuClass}`}
      aria-label="Search Map Page"
    >
      <div
        className="m-map-page__input-and-results"
        aria-label="Map Search Panel"
        {...(vpcEnabled ? { hidden: true } : {})}
      >
        <div className="m-map-page__input">
          <SearchForm onSubmit={onSearchCallback} onClear={onSearchCallback} />
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
              selectedVehicleId={liveSelectedVehicle?.id || null}
              onClick={selectVehicle}
            />
          ) : (
            <RecentSearches />
          )}
        </div>
      </div>
      <div className="m-map-page__map">
        <Map
          reactLeafletRef={leafletMap}
          // show the selected vehicle on the map even when it isn't in the search results
          vehicles={
            liveSelectedVehicle &&
            !onlyVehicles.find((v) => v.id === liveSelectedVehicle.id)
              ? [...onlyVehicles, liveSelectedVehicle]
              : onlyVehicles
          }
          onPrimaryVehicleSelect={selectVehicle}
          shapes={showVehicleCard ? selectedVehicleShapes : undefined}
          allowStreetView={true}
          stopCardDirection={liveSelectedVehicle?.directionId}
          includeStopCard={true}
          stations={stations}
          selectedVehicleId={searchPageState.selectedVehicleId ?? undefined}
        >
          {vpcEnabled ? (
            <VehiclePropertiesCard
              vehicle={liveSelectedVehicle}
              onClose={() => {
                dispatch(setSelectedVehicle(null))
                setShowVehicleCard(false)
              }}
            />
          ) : undefined}
        </Map>
      </div>
    </div>
  )
}

const MapPageWithSelectedVehicle = ({ vehicleId }: { vehicleId: string }) => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)

  const vehicleOrGhost = useVehicleForId(socket, vehicleId)

  return (
    <MapPageInternal
      liveSelectedVehicle={
        vehicleOrGhost && isVehicle(vehicleOrGhost) ? vehicleOrGhost : null
      }
    />
  )
}

const MapPage = (): ReactElement<HTMLDivElement> => {
  const [{ searchPageState }] = useContext(StateDispatchContext)

  return searchPageState.selectedVehicleId ? (
    <MapPageWithSelectedVehicle vehicleId={searchPageState.selectedVehicleId} />
  ) : (
    <MapPageInternal liveSelectedVehicle={null} />
  )
}

export default MapPage
