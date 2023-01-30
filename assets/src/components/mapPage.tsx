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
import {
  SearchPageState,
  SelectedEntity,
  SelectedEntityType,
  setSelectedVehicle,
} from "../state/searchPageState"
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
  selectedEntity,
  selectVehicle,
}: {
  searchPageState: SearchPageState
  mobileDisplay?: ReactElement
  selectedEntity: SelectedEntity | null
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
            selectedVehicleId={
              (selectedEntity?.type === SelectedEntityType.VEHICLE &&
                selectedEntity.vehicleId) ||
              null
            }
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
const useMostRecentNonNullVehicle = (
  selectedVehicleOrGhost: VehicleOrGhost | null
) => {
  const ref = useRef<VehicleOrGhost | null>(null)

  if (selectedVehicleOrGhost !== null) {
    ref.current = selectedVehicleOrGhost
  }

  return ref.current
}

const useMostRecentVehicleById = (
  socket: Socket | undefined,
  selectedVehicleId: string | null
) => {
  const selectedVehicleOrGhost =
    useVehicleForId(socket, selectedVehicleId ?? null) || null

  const vehicleRef = useMostRecentNonNullVehicle(selectedVehicleOrGhost)

  // `selectedVehicleId` should change 'atomically', therefore, if it's `null`,
  // there should be no result or api response, and should return `null`
  if (selectedVehicleId === null) {
    return null
  }

  return vehicleRef
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
      {filterVehicles(vehicles).map((vehicle: Vehicle) => {
        const isSelected = vehicle.id === selectedVehicleId
        return (
          <VehicleMarker
            key={vehicle.id}
            vehicle={vehicle}
            isPrimary={isSelected === true}
            isSelected={isSelected}
            onSelect={onPrimaryVehicleSelect}
          />
        )
      })}
    </>
  )
}

const onFollowerUpdate: UpdateMapFromPointsFn = (map, points) => {
  if (points.length === 0) {
    // If there are no points, blink to default center
    map.setView(defaultCenter, 13, { animate: false })
    return
  }

  const { width, height } = map.getContainer().getBoundingClientRect()
  const mapContainerBounds = new Bounds([0, 0], [width, height])

  // ```
  // vpcElement.getBoundingClientRect().right - mapElement.getBoundingClientRect().left
  //  -> 445
  // ```
  // Create a new inner bounds from the map bounds + "padding" to shrink the
  // inner bounds
  // In this case, we get the top left of the inner bounds by padding the left
  // with the distance from the right side of the VPC to the left side of the
  // map container
  const topLeft = new Point(445, 0)
  const innerBounds = new Bounds(topLeft, mapContainerBounds.getBottomRight())
  // The "new center" is the offset between the two bounding boxes centers
  const offset = innerBounds
    .getCenter()
    .subtract(mapContainerBounds.getCenter())

  const targetZoom = 16
  const targetPoint = map
      // Project the target point into screenspace for the target zoom
      .project(points[0], targetZoom)
      // Offset the target point in screenspace to move the center of the map
      // to apply the padding to the center
      .subtract(offset),
    // convert the target point to worldspace from screenspace
    targetLatLng = map.unproject(targetPoint, targetZoom)

  // Zoom/Pan center of map to offset location in worldspace
  map.setView(targetLatLng, targetZoom)
}

const useFollowingStateWithSelectionLogic = (
  selectedVehicleId: string | null,
  selectedVehicleRef: VehicleOrGhost | null
) => {
  const state = useInteractiveFollowerState(),
    { setShouldFollow } = state

  // when the selected vehicle ID and last api do or don't reference the same
  // vehicle
  const vehicleIdDiffers = selectedVehicleId !== selectedVehicleRef?.id
  useEffect(() => {
    // Only update the shouldFollow state once the cached value agrees with
    // the selection state.
    // Otherwise the follower may try to center on stale data from the
    // previous selection before `useVehicleForId` resolves to it's next value.
    if (selectedVehicleId !== null && vehicleIdDiffers === false) {
      setShouldFollow(true)
    }
  }, [vehicleIdDiffers, setShouldFollow, selectedVehicleId])
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
  const selectedVehicleOrGhost = useMostRecentVehicleById(
      socket,
      selectedVehicleId
    ),
    { routeId = null, tripId = null } = selectedVehicleOrGhost || {}

  const tripShapes = useTripShape(tripId)

  const position =
    (selectedVehicleOrGhost &&
      isVehicle(selectedVehicleOrGhost) && [
        vehicleToLeafletLatLng(selectedVehicleOrGhost),
      ]) ||
    []

  const followerState = useFollowingStateWithSelectionLogic(
    selectedVehicleId,
    selectedVehicleOrGhost
  )

  const shapes =
    selectedVehicleOrGhost &&
    (isGhost(selectedVehicleOrGhost) || selectedVehicleOrGhost?.isShuttle)
      ? []
      : tripShapes
  return (
    <BaseMap
      vehicles={[]}
      allowStreetView={true}
      stopCardDirection={selectedVehicleOrGhost?.directionId}
      includeStopCard={true}
      stations={stations}
      shapes={shapes}
      stateClasses={FollowerStatusClasses(followerState.shouldFollow)}
    >
      <>
        {selectedVehicleOrGhost && (
          <>
            {showVpc && (
              <VehiclePropertiesCard
                vehicleOrGhost={selectedVehicleOrGhost}
                onClose={deleteSelection}
              />
            )}
            {isVehicle(selectedVehicleOrGhost) &&
              (selectedVehicleOrGhost?.isShuttle ? (
                <VehicleMarker
                  key={selectedVehicleOrGhost.id}
                  vehicle={selectedVehicleOrGhost}
                  isPrimary={true}
                  isSelected={true}
                />
              ) : (
                <RouteVehicles
                  selectedVehicleRoute={routeId}
                  selectedVehicleId={selectedVehicleId}
                  onPrimaryVehicleSelect={setSelectedVehicle}
                />
              ))}
          </>
        )}

        <InterruptibleFollower
          onUpdate={onFollowerUpdate}
          positions={position}
          {...followerState}
        />
      </>
    </BaseMap>
  )
}
// #endregion

const MapPage = (): ReactElement<HTMLDivElement> => {
  const [{ searchPageState, mobileMenuIsOpen }, dispatch] =
      useContext(StateDispatchContext),
    { selectedEntity = null } = searchPageState

  // #region Search Drawer Logic
  const [searchOpen, setSearchOpen] = useState<boolean>(selectedEntity === null)
  const toggleSearchDrawer = useCallback(
    () => setSearchOpen((open) => !open),
    [setSearchOpen]
  )
  // #endregion

  const selectVehicle = useCallback(
    (vehicle: VehicleOrGhost | null) => {
      dispatch(setSelectedVehicle(vehicle?.id || null))
      setSearchOpen(vehicle === null)
    },
    [setSearchOpen, dispatch]
  )

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
            selectedEntity,
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
          selectedVehicleId={
            (selectedEntity?.type === SelectedEntityType.VEHICLE &&
              selectedEntity.vehicleId) ||
            null
          }
          setSelectedVehicle={selectVehicle}
          showVpc={!searchOpen}
        />
      </div>
    </div>
  )
}

export default MapPage
