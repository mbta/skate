import { Socket } from "phoenix"
import React, { ReactElement, useCallback, useContext, useState } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { useTripShape } from "../hooks/useShapes"
import { useStations } from "../hooks/useStations"
import useVehicleForId from "../hooks/useVehicleForId"
import useVehiclesForRoute from "../hooks/useVehiclesForRoute"
import { filterVehicles, isVehicle } from "../models/vehicle"
import { Vehicle, VehicleId, VehicleOrGhost } from "../realtime"
import { SearchPageState, setSelectedVehicle } from "../state/searchPageState"
import DrawerTab from "./drawerTab"
import {
  BaseMap,
  ContainedAutoCenterMapOn,
  vehicleToLeafletLatLng,
} from "./map"
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
  selectVehicleId,
}: {
  searchPageState: SearchPageState
  mobileDisplay?: ReactElement
  selectedVehicleId: string | null
  selectVehicleId?: (value: VehicleId | null) => void
}): React.ReactElement => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const searchVehicles: VehicleOrGhost[] | null = useSearchResults(
    socket,
    searchPageState.isActive ? searchPageState.query : null
  )

  const selectVehicle = useCallback(
    (vehicle: VehicleOrGhost): void => {
      if (isVehicle(vehicle)) {
        selectVehicleId && selectVehicleId(vehicle?.id)
      }
    },
    [selectVehicleId]
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

const MapDisplay = ({
  selectedVehicleIdState: [selectedVehicleId, setSelectedVehicleId],
  showVpc,
}: {
  selectedVehicleIdState: [VehicleId | null, React.Dispatch<VehicleId | null>]
  showVpc: boolean
}) => {
  const selectVehicle = useCallback(
    (vehicle: VehicleOrGhost): void => {
      if (isVehicle(vehicle) && setSelectedVehicleId) {
        setSelectedVehicleId(vehicle.id)
      }
    },
    [setSelectedVehicleId]
  )

  const deleteSelection = useCallback(() => {
    setSelectedVehicleId && setSelectedVehicleId(null)
  }, [setSelectedVehicleId])

  const stations = useStations()

  const { socket } = useContext(SocketContext)

  const selectedVehicleOrGhost =
    useVehicleForId(socket, selectedVehicleId ?? null) || null

  const _selectedVehicle: Vehicle | null =
    (selectedVehicleOrGhost &&
      isVehicle(selectedVehicleOrGhost) &&
      selectedVehicleOrGhost) ||
    null
  const selectedVehicleDeferred = _selectedVehicle

  const vehicles =
    useVehiclesForRoute(socket, selectedVehicleDeferred?.routeId ?? null) ||
    ([selectedVehicleDeferred].filter(Boolean) as VehicleOrGhost[])
  const selectedVehicleShapes = useTripShape(
    selectedVehicleDeferred?.tripId || null
  )

  return (
    <BaseMap
      vehicles={filterVehicles(vehicles)}
      onPrimaryVehicleSelect={selectVehicle}
      shapes={
        (_selectedVehicle?.isShuttle === false && selectedVehicleShapes) || []
      }
      allowStreetView={true}
      stopCardDirection={selectedVehicleDeferred?.directionId}
      includeStopCard={true}
      stations={stations}
      selectedVehicleId={selectedVehicleId || undefined}
    >
      <>
        <ContainedAutoCenterMapOn
          key={selectedVehicleId || ""}
          positions={(
            [selectedVehicleDeferred].filter(Boolean) as Vehicle[]
          ).map(vehicleToLeafletLatLng)}
        />
        {showVpc && selectedVehicleDeferred && (
          <>
            <VehiclePropertiesCard
              vehicle={selectedVehicleDeferred}
              onClose={deleteSelection}
            />
          </>
        )}
      </>
    </BaseMap>
  )
}

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

  const selectVehicleId = useCallback(
    (value: VehicleId | null) => {
      dispatch(setSelectedVehicle(value))
      setSearchOpen(value === null)
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
            selectVehicleId,
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
          selectedVehicleIdState={[selectedVehicleId, selectVehicleId]}
          showVpc={!searchOpen}
        />
      </div>
    </div>
  )
}

export default MapPage
