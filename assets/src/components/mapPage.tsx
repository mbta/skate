import { Map as LeafletMap } from "leaflet"
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

const SearchInputAndResults = (props: {
  searchPageState: SearchPageState
  mobileDisplay?: ReactElement
  selectedVehicleId: string | null
  selectVehicleId?: (value: VehicleId | null) => void
}): React.ReactElement => {
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const searchVehicles: VehicleOrGhost[] | null = useSearchResults(
    socket,
    props.searchPageState.isActive ? props.searchPageState.query : null
  )

  const selectVehicle = useCallback(
    (vehicle: VehicleOrGhost): void => {
      if (isVehicle(vehicle)) {
        props.selectVehicleId && props.selectVehicleId(vehicle?.id)
      }
    },
    [props.selectVehicleId]
  )

  return (
    <>
      <div className="m-map-page__input">
        <SearchForm formTitle="Search Map" inputTitle="Search Map Query" />
        {props.mobileDisplay}
      </div>

      <hr />

      <div className="m-search-display">
        {searchVehicles !== null &&
        thereIsAnActiveSearch(searchVehicles, props.searchPageState) ? (
          <SearchResults
            vehicles={searchVehicles}
            selectedVehicleId={props.selectedVehicleId}
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
  const selectVehicle = useCallback((vehicle: VehicleOrGhost): void => {
    if (isVehicle(vehicle) && setSelectedVehicleId) {
      setSelectedVehicleId(vehicle.id)
    }
  }, [])

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

  const leafletMap = useRef<LeafletMap | null>(null)
  useEffect(() => {
    // Let leaflet know when Page resizes due to vpc state
    leafletMap.current?.invalidateSize()
  }, [showVpc])

  return (
    <BaseMap
      reactLeafletRef={leafletMap}
      vehicles={filterVehicles(vehicles)}
      onPrimaryVehicleSelect={selectVehicle}
      shapes={selectedVehicleShapes}
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
  // useEffect(() => {
  //   if (selectedVehicleId !== null) {
  //     setSearchOpen(false)
  //   }
  // }, [selectedVehicleId])

  // useEffect(() => {
  //   if (selectedVehicleId !== null) {
  //     setSearchOpen(false)
  //   }
  //   // }, [selectedVehicleId === null])
  // }, [selectedVehicleId])
  // #endregion

  // const selectVehicleId: Dispatch<SetStateAction<VehicleId | null>> = useCallback(
  const selectVehicleId = useCallback(
    (value: VehicleId | null) => {
      dispatch(setSelectedVehicle(value))
      setSearchOpen(value === null)

      // if (id === null) {
      //   setSearchOpen(true)
      // } else {
      //   setSearchOpen(false)
      // }
    },
    [setSearchOpen, setSelectedVehicle, dispatch]
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
