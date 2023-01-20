import { Map as LeafletMap } from "leaflet"
import { Socket } from "phoenix"
import React, {
  ReactElement,
  useContext,
  useDeferredValue,
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
import useVehiclesForRoute from "../hooks/useVehiclesForRoute"
import { isVehicle } from "../models/vehicle"
import { Vehicle, VehicleId, VehicleOrGhost } from "../realtime"
import { SearchPageState, setSelectedVehicle } from "../state/searchPageState"
import DrawerTab from "./drawerTab"
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
      className="m-map-page__toggle-mobile-display-button button-text"
      onClick={onToggleMobileDisplay}
    >
      Show {otherDisplayName} instead
    </button>
  )
}

const MapPage = (): ReactElement<HTMLDivElement> => {
  const [{ searchPageState, mobileMenuIsOpen }, dispatch] =
    useContext(StateDispatchContext)
  const stations = useStations()

  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const searchVehicles: VehicleOrGhost[] | null = useSearchResults(
    socket,
    searchPageState.isActive ? searchPageState.query : null
  )

  const selectedVehicle =
    useVehicleForId(socket, searchPageState.selectedVehicleId ?? null) || null
  const vehicles =
    useVehiclesForRoute(socket, selectedVehicle?.routeId ?? null) ||
    ([selectedVehicle].filter(Boolean) as VehicleOrGhost[])

  const onlyVehicles: Vehicle[] = filterVehicles(vehicles)

  const [mobileDisplay, setMobileDisplay] = useState(MobileDisplay.List)
  const [selectedVehicleId, setSelectedVehicleId] = useState<VehicleId | null>(
    searchPageState.selectedVehicleId ?? null
  )
  const [searchOpen, setSearchOpen] = useState<boolean>(true)

  const liveVehicle: Vehicle | null = useDeferredValue(
    (selectedVehicle && isVehicle(selectedVehicle) && selectedVehicle) || null
  )
  const selectedVehicleShapes = useTripShape(liveVehicle?.tripId || null)

  const onSearchCallback = () => {
    setSelectedVehicleId(null)
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
      selectVehicleId(vehicle?.id)
    }
  }

  function selectVehicleId(id: VehicleId | null) {
    setSelectedVehicleId(id)
    dispatch(setSelectedVehicle(id))
  }

  const mobileDisplayClass =
    mobileDisplay === MobileDisplay.List
      ? "m-map-page--show-list"
      : "m-map-page--show-map"

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""
  const vpcEnabled = Boolean(liveVehicle)

  const leafletMap = useRef<LeafletMap | null>(null)
  useEffect(() => {
    setSearchOpen(!vpcEnabled)

    // Let leaflet know when Page resizes due to vpc state
    leafletMap.current?.invalidateSize()
  }, [vpcEnabled])

  return (
    <div
      className={`m-map-page ${mobileDisplayClass} ${mobileMenuClass} inherit-box border-box`}
      aria-label="Search Map Page"
    >
      <div
        className={`m-map-page__input-and-results ${
          searchOpen ? "visible" : "hidden"
        }`}
        aria-label="Map Search Panel"
      >
        <DrawerTab
          isVisible={searchOpen}
          toggleVisibility={() => setSearchOpen((a) => !a)}
        />
        <div className="m-map-page__input">
          <SearchForm
            onSubmit={onSearchCallback}
            onClear={onSearchCallback}
            formTitle="Search Map"
            inputTitle="Search Map Query"
          />
          <ToggleMobileDisplayButton
            mobileDisplay={mobileDisplay}
            onToggleMobileDisplay={toggleMobileDisplay}
          />
        </div>

        <hr />

        <div className="m-search-display">
          {searchVehicles !== null &&
          thereIsAnActiveSearch(searchVehicles, searchPageState) ? (
            <SearchResults
              vehicles={searchVehicles}
              selectedVehicleId={liveVehicle?.id || null}
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
          vehicles={onlyVehicles}
          onPrimaryVehicleSelect={selectVehicle}
          shapes={vpcEnabled ? selectedVehicleShapes : undefined}
          allowStreetView={true}
          stopCardDirection={liveVehicle?.directionId}
          includeStopCard={true}
          stations={stations}
          selectedVehicleId={selectedVehicleId ?? undefined}
        >
          <>
            {selectedVehicle && isVehicle(selectedVehicle) && <></>}

            {vpcEnabled === true && (
              <>
                <VehiclePropertiesCard
                  vehicle={liveVehicle!}
                  onClose={() => {
                    dispatch(setSelectedVehicle(null))
                    // setShowVehicleCard(false)
                  }}
                />
              </>
            )}
          </>
        </Map>
      </div>
    </div>
  )
}

export default MapPage
