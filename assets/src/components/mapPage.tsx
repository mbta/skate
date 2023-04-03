import { Socket } from "phoenix"
import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useSearchResults from "../hooks/useSearchResults"
import { VehicleOrGhost } from "../realtime"
import { OpenView, closeView } from "../state"
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

const thereIsAnActiveSearch = (
  vehicles: VehicleOrGhost[] | null,
  searchPageState: SearchPageState
): boolean => vehicles !== null && searchPageState.isActive

const SearchInputAndResults = ({
  searchPageState,
  selectedEntity,
  selectVehicle,
}: {
  searchPageState: SearchPageState
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
      <div className="c-map-page__input u-hideable">
        <SearchForm
          formTitle="Search Map"
          inputTitle="Search Map Query"
          submitEvent="Search submitted from map page"
        />
      </div>

      <hr />

      <div className="m-search-display u-hideable">
        {searchVehicles !== null &&
        thereIsAnActiveSearch(searchVehicles, searchPageState) ? (
          <SearchResults
            vehicles={searchVehicles}
            selectedVehicleId={
              (selectedEntity?.type === SelectedEntityType.Vehicle &&
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
  const [{ searchPageState, openView }, dispatch] =
      useContext(StateDispatchContext),
    { selectedEntity = null } = searchPageState

  useEffect(() => {
    // don't dispatch closeView if the VPP is open
    if (openView !== OpenView.None) {
      dispatch(closeView())
    }
  }, [dispatch, openView])

  // #region Search Drawer Logic
  const [searchOpen, setSearchOpen] = useState<boolean>(selectedEntity === null)
  const toggleSearchDrawer = useCallback(
    () => setSearchOpen((open) => !open),
    [setSearchOpen]
  )
  // #endregion

  const setSelection = useCallback(
    (selectedEntity: SelectedEntity | null) => {
      switch (selectedEntity?.type) {
        case SelectedEntityType.Vehicle:
          window.FS?.event("VPC Opened")
          break
        case SelectedEntityType.RoutePattern:
          window.FS?.event("RPC Opened")
      }

      dispatch(setSelectedEntity(selectedEntity))
      setSearchOpen(selectedEntity === null)
    },
    [dispatch, setSearchOpen]
  )

  const selectVehicle = useCallback(
    (vehicleOrGhost: VehicleOrGhost | null) => {
      if (vehicleOrGhost) {
        setSelection({
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicleOrGhost.id,
        })
      } else {
        setSelection(null)
      }
    },
    [setSelection]
  )

  return (
    <div
      className="c-map-page inherit-box border-box"
      aria-label="Search Map Page"
    >
      <div
        className={`c-map-page__input-and-results ${
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
        />
      </div>
      <div className="c-map-page__map">
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
