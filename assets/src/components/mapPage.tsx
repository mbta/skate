import { Socket } from "phoenix"
import React, { ReactElement, useCallback, useContext, useState } from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { VehicleOrGhost } from "../realtime"
import {
  SearchPageState,
  SelectedEntity,
  SelectedEntityType,
  setSelectedEntity,
} from "../state/searchPageState"
import DrawerTab from "./drawerTab"
import MapDisplay from "./mapPage/mapDisplay"
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

  const setSelection = useCallback(
    (selectedEntity: SelectedEntity | null) => {
      dispatch(setSelectedEntity(selectedEntity))
      setSearchOpen(selectedEntity === null)
    },
    [dispatch, setSearchOpen]
  )

  const selectVehicle = useCallback(
    (vehicleOrGhost: VehicleOrGhost | null) => {
      vehicleOrGhost
        ? setSelection({
            type: SelectedEntityType.VEHICLE,
            vehicleId: vehicleOrGhost.id,
          })
        : setSelection(null)
    },
    [setSelection]
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
          selectedEntity={selectedEntity}
          setSelection={setSelection}
          showSelectionCard={!searchOpen}
        />
      </div>
    </div>
  )
}

export default MapPage
