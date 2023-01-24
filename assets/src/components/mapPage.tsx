import { Bounds, Point } from "leaflet"
import { Socket } from "phoenix"
import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
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
import { RouteId } from "../schedule"
import { SearchPageState, setSelectedVehicle } from "../state/searchPageState"
import DrawerTab from "./drawerTab"
import {
  BaseMap,
  defaultCenter,
  FollowerStatusClasses,
  InterruptibleFollower,
  UpdateMapFromPointsFn,
  useInteractiveFollowerState,
  vehicleToLeafletLatLng,
} from "./map"
import { VehicleMarker } from "./mapMarkers"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"
import SearchResults from "./searchResults"
import VehiclePropertiesCard from "./vehiclePropertiesCard"
import Leaflet from "leaflet"

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

const onFollowerUpdate: UpdateMapFromPointsFn = (map, points) => {
  if (points.length === 0) {
    map.setView(defaultCenter, 13, { animate: false })
    return
  }
  const bounds = map.getContainer().getBoundingClientRect()
  const containerBounds = new Bounds([0, 0], [bounds.width, bounds.height])

  const topLeft = new Point(445, 0)
  const innerBounds = new Bounds(
    topLeft,
    containerBounds.getBottomRight() //.subtract([42, 15])
  )

    const targetZoom = 16
    const targetPoint = map
        .project(points[0], targetZoom)
        .subtract(
          innerBounds.getCenter().subtract(containerBounds.getCenter())
        ),
      targetLatLng = map.unproject(targetPoint, targetZoom)
    // const targetLatLng = points[0]
    map.setView(targetLatLng, targetZoom)
  }
}

const useFollowingStateWithSelectionLogic = (
  selectedVehicleId: string | null,
  selectedVehicleRef: Vehicle | null
) => {
  const state = useInteractiveFollowerState(),
    { setShouldFollow } = state

  // when the selected vehicle ID and last api do or don't reference the same
  // vehicle
  useEffect(() => {
    // Only update the shouldFollow state once the cached value agrees with
    // the selection state.
    // Otherwise the follower may try to center on stale data from the
    // previous selection before `useVehicleForId` resolves to it's next value.
    if (selectedVehicleId && selectedVehicleId === selectedVehicleRef?.id) {
      setShouldFollow(true)
    }
  }, [selectedVehicleId !== selectedVehicleRef?.id])
  return state
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

  const state = useFollowingStateWithSelectionLogic(
    selectedVehicleId,
    selectedVehicleRef
  )

  return (
    <BaseMap
      vehicles={[]}
      allowStreetView={true}
      stopCardDirection={selectedVehicleRef?.directionId}
      includeStopCard={true}
      stations={stations}
      shapes={selectedVehicleRef?.isShuttle ? [] : shapes}
      stateClasses={FollowerStatusClasses(state.shouldFollow)}
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

        <InterruptibleFollower
          onUpdate={onFollowerUpdate}
          positions={position}
          {...state}
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
