import { Socket } from "phoenix"
import React, {
  ReactElement,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { useTripShape } from "../hooks/useShapes"
import useSocket from "../hooks/useSocket"
import { useStations } from "../hooks/useStations"
import useVehicleForId from "../hooks/useVehicleForId"
import useVehiclesForRoute from "../hooks/useVehiclesForRoute"
import { filterVehicles, isGhost, isVehicle } from "../models/vehicle"
import { Vehicle, VehicleId, VehicleOrGhost } from "../realtime"
import { RouteId, TripId } from "../schedule"
import { SearchPageState, setSelectedVehicle } from "../state/searchPageState"
import DrawerTab from "./drawerTab"
import {
  BaseMap,
  ContainedAutoCenterMapOn,
  vehicleToLeafletLatLng,
} from "./map"
import { VehicleMarker } from "./mapMarkers"
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

const SearchInputAndResults = ({
  searchPageState,
  mobileDisplay,
  selectedVehicleId,
  selectVehicle,
}: {
  searchPageState: SearchPageState
  mobileDisplay?: ReactElement
  selectedVehicleId: string | null
  selectVehicle: (vehicle: VehicleOrGhost | null) => void
}): React.ReactElement => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const searchVehicles: VehicleOrGhost[] | null = useSearchResults(
    socket,
    searchPageState.isActive ? searchPageState.query : null
  )

  return (
    <>
      <div className="m-map-page__input">
        <SearchForm formTitle="Search Map" inputTitle="Search Map Query" />
        {mobileDisplay}
      </div>

      <hr />

      <div className="m-search-display">
        {searchVehicles !== null &&
        thereIsAnActiveSearch(searchVehicles, searchPageState) ? (
          <SearchResults
            vehicles={searchVehicles}
            selectedVehicleId={selectedVehicleId}
            onClick={selectVehicle}
          />
        ) : (
          <RecentSearches />
        )}
      </div>
    </>
  )
}

// #region Map Display
const useCachedVehicleById = (
  selectedVehicleOrGhost: VehicleOrGhost | null,
  selectedVehicleId: string | null
) => {
  const ref = useRef(
    (selectedVehicleOrGhost &&
      isVehicle(selectedVehicleOrGhost) &&
      selectedVehicleOrGhost) ||
      null
  )

  if (
    selectedVehicleId === null ||
    (selectedVehicleOrGhost && isGhost(selectedVehicleOrGhost))
  ) {
    ref.current = null
  } else if (selectedVehicleOrGhost !== null) {
    ref.current = selectedVehicleOrGhost
  }
  return ref.current
}

const useVehicleForIdCached = (
  socket: Socket | undefined,
  selectedVehicleId: string | null
) => {
  const selectedVehicleOrGhost =
    useVehicleForId(socket, selectedVehicleId ?? null) || null

  const selectedVehicleRef = useCachedVehicleById(
    selectedVehicleOrGhost,
    selectedVehicleId
  )
  return selectedVehicleRef
}

const RouteVehicles = ({
  selectedVehicleRoute,
  selectedVehicleId,
  onPrimaryVehicleSelect,
}: {
  selectedVehicleId: VehicleId | null
  selectedVehicleRoute: RouteId | null
  onPrimaryVehicleSelect: (vehicle: Vehicle) => void
}) => {
  const { socket } = useSocket()
  const vehicles = useVehiclesForRoute(socket, selectedVehicleRoute)
  return (
    <>
      {filterVehicles(vehicles).map((vehicle: Vehicle) => (
        <VehicleMarker
          key={vehicle.id}
          vehicle={vehicle}
          isPrimary={true}
          isSelected={vehicle.id === selectedVehicleId}
          onSelect={onPrimaryVehicleSelect}
        />
      ))}
    </>
  )
}

const MapDisplay = ({
  selectedVehicleId,
  setSelectedVehicle,
  showVpc,
}: {
  selectedVehicleId: VehicleId | null
  setSelectedVehicle: React.Dispatch<VehicleOrGhost | null>
  showVpc: boolean
}) => {
  const deleteSelection = useCallback(() => {
    setSelectedVehicle && setSelectedVehicle(null)
  }, [setSelectedVehicle])

  const stations = useStations()

  const { socket } = useContext(SocketContext)

  const selectedVehicleRef = useVehicleForIdCached(socket, selectedVehicleId),
    { routeId = null, tripId = null } = selectedVehicleRef || {}
  const shapes = useTripShape(tripId)

  const position =
    (selectedVehicleRef &&
      isVehicle(selectedVehicleRef) && [
        vehicleToLeafletLatLng(selectedVehicleRef),
      ]) ||
    []


  return (
    <BaseMap
      vehicles={[]}
      allowStreetView={true}
      stopCardDirection={selectedVehicleRef?.directionId}
      includeStopCard={true}
      stations={stations}
      shapes={selectedVehicleRef?.isShuttle ? [] : shapes}
    >
      <>
        {showVpc && selectedVehicleRef && isVehicle(selectedVehicleRef) && (
          <>
            <VehiclePropertiesCard
              vehicle={selectedVehicleRef}
              onClose={deleteSelection}
            />
          </>
        )}
        {selectedVehicleRef?.isShuttle ? (
          <>
            <VehicleMarker
              key={selectedVehicleRef.id}
              vehicle={selectedVehicleRef}
              isPrimary={true}
              isSelected={true}
            />
          </>
        ) : (
          <>
            <RouteVehicles
              selectedVehicleRoute={routeId}
              selectedVehicleId={selectedVehicleId}
              onPrimaryVehicleSelect={setSelectedVehicle}
            />
          </>
        )}

        <ContainedAutoCenterMapOn
          key={selectedVehicleRef?.id || ""}
          positions={positions}
        />
      </>
    </BaseMap>
  )
}
// #endregion

const MapPage = (): ReactElement<HTMLDivElement> => {
  const [{ searchPageState, mobileMenuIsOpen }, dispatch] =
      useContext(StateDispatchContext),
    { selectedVehicleId = null } = searchPageState

  // #region mobile display
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
      ? "m-map-page--show-list"
      : "m-map-page--show-map"

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""
  // #endregion

  // #region Search Drawer Logic
  const [searchOpen, setSearchOpen] = useState<boolean>(
    selectedVehicleId === null
  )
  const toggleSearchDrawer = useCallback(
    () => setSearchOpen((open) => !open),
    [setSearchOpen]
  )
  // #endregion

  const selectVehicle = useCallback(
    (vehicle: VehicleOrGhost | null) => {
      dispatch(setSelectedVehicle(vehicle?.id || null))
      setSearchOpen(vehicle === null)
      // if (vehicle && isGhost(vehicle)) {
      //   setSearchOpen()
      // } else {
      // }
    },
    [setSearchOpen, dispatch]
  )

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
          toggleVisibility={toggleSearchDrawer}
        />
        <SearchInputAndResults
          {...{
            selectVehicle: selectVehicle,
            selectedVehicleId,
            searchPageState,
          }}
          mobileDisplay={
            <ToggleMobileDisplayButton
              mobileDisplay={mobileDisplay}
              onToggleMobileDisplay={toggleMobileDisplay}
            />
          }
        />
      </div>
      <div className="m-map-page__map">
        <MapDisplay
          selectedVehicleId={selectedVehicleId}
          setSelectedVehicle={selectVehicle}
          showVpc={!searchOpen}
        />
      </div>
    </div>
  )
}

export default MapPage
