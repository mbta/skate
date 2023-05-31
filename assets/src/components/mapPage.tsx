import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import useSearchResults from "../hooks/useSearchResults"
import { VehicleId, VehicleOrGhost } from "../realtime"
import { OpenView, closeView } from "../state"
import {
  SearchPageState,
  SelectedEntity,
  SelectedEntityType,
  setSearchText,
  setSelectedEntity,
} from "../state/searchPageState"
import DrawerTab from "./drawerTab"
import MapDisplay from "./mapPage/mapDisplay"
import RecentSearches from "./recentSearches"
import SearchForm from "./searchForm"
import SearchResults from "./searchResults"
import VehiclePropertiesCard from "./mapPage/vehiclePropertiesCard"
import Loading from "./loading"
import useMostRecentVehicleById from "../hooks/useMosRecentVehicleById"
import useSocket from "../hooks/useSocket"
import { ChevronLeftIcon, SearchIcon } from "../helpers/icon"

const thereIsAnActiveSearch = (
  vehicles: VehicleOrGhost[] | null,
  searchPageState: SearchPageState
): boolean => vehicles !== null && searchPageState.isActive

const SearchMode = ({
  searchPageState,
  selectVehicle,
}: {
  searchPageState: SearchPageState
  selectVehicle: (vehicle: VehicleOrGhost | null) => void
}): React.ReactElement => {
  const { socket } = useContext(SocketContext)
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
      <div className="c-search-display u-hideable">
        {searchVehicles !== null &&
        thereIsAnActiveSearch(searchVehicles, searchPageState) ? (
          <SearchResults
            vehicles={searchVehicles}
            selectedVehicleId={null}
            onClick={selectVehicle}
          />
        ) : (
          <RecentSearches />
        )}
      </div>
    </>
  )
}

const SelectedVehicle = ({ vehicleId }: { vehicleId: VehicleId }) => {
  // TODO: When using socket from context, this doesn't work as-is
  // Presumably because the useMostRecentVehicleById hook is being used twice, but
  // haven't tracked down error yet
  const { socket } = useSocket()

  const selectedVehicleOrGhost = useMostRecentVehicleById(socket, vehicleId)

  return selectedVehicleOrGhost ? (
    <VehiclePropertiesCard
      vehicleOrGhost={selectedVehicleOrGhost}
      key={selectedVehicleOrGhost.id}
    />
  ) : (
    <Loading />
  )
}

const Selection = ({
  selectedEntity,
  setSelection,
}: {
  selectedEntity: SelectedEntity
  setSelection: (selectedEntity: SelectedEntity | null) => void
}): ReactElement => {
  const [{ searchPageState }, dispatch] = useContext(StateDispatchContext)
  return (
    <div>
      <div className="c-map-page__search-actions">
        {searchPageState.query.text !== "" && (
          <button
            className="button-secondary c-map-page__back-button"
            onClick={() => {
              setSelection(null)
            }}
          >
            <ChevronLeftIcon />
            Back
          </button>
        )}
        <button
          className="button-submit c-map-page__new-search-button"
          onClick={() => {
            setSelection(null)
            dispatch(setSearchText(""))
          }}
        >
          <SearchIcon />
          New Search
        </button>
      </div>
      <hr />
      {selectedEntity.type === SelectedEntityType.Vehicle ? (
        <SelectedVehicle vehicleId={selectedEntity.vehicleId} />
      ) : (
        <p>TODO: Route selection</p>
      )}
    </div>
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
  const [searchOpen, setSearchOpen] = useState<boolean>(
    !selectedEntity || selectedEntity.type === SelectedEntityType.Vehicle
  )
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
      setSearchOpen(
        !selectedEntity || selectedEntity.type === SelectedEntityType.Vehicle
      )
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
        className={joinClasses([
          "c-map-page__input-and-results",
          searchOpen
            ? "c-map-page__input-and-results--visible"
            : "c-map-page__input-and-results--hidden",
        ])}
        aria-label="Map Search Panel"
      >
        <DrawerTab
          isVisible={searchOpen}
          toggleVisibility={toggleSearchDrawer}
        />
        {selectedEntity &&
        // TODO: support showing route selection
        selectedEntity.type === SelectedEntityType.Vehicle ? (
          <Selection
            selectedEntity={selectedEntity}
            setSelection={setSelection}
          />
        ) : (
          <SearchMode
            searchPageState={searchPageState}
            selectVehicle={selectVehicle}
          />
        )}
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
