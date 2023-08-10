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
import { ChevronLeftIcon, SearchIcon } from "../helpers/icon"
import useMostRecentVehicleById from "../hooks/useMostRecentVehicleById"
import usePatternsByIdForRoute from "../hooks/usePatternsByIdForRoute"
import useSocket from "../hooks/useSocket"
import useSearchResults from "../hooks/useSearchResults"
import { Ghost, Vehicle, VehicleId } from "../realtime"
import { RoutePattern } from "../schedule"
import { closeView, OpenView } from "../state"
import {
  goBack,
  newSearchSession,
  SearchPageState,
  SelectedEntity,
  SelectedEntityType,
  SelectedRoutePattern,
  setSelectedEntity,
} from "../state/searchPageState"
import DrawerTab from "./drawerTab"
import Loading from "./loading"
import MapDisplay from "./mapPage/mapDisplay"
import RoutePropertiesCard from "./mapPage/routePropertiesCard"
import VehiclePropertiesCard from "./mapPage/vehiclePropertiesCard"
import RecentSearches from "./recentSearches"
import SearchFormFromStateDispatchContext from "./searchForm"
import SearchResults from "./searchResults"
import { VisualSeparator } from "./visualSeparator"
import OldSearchForm from "./oldSearchForm"
import inTestGroup, { TestGroups } from "../userInTestGroup"
import { Socket } from "phoenix"
import SearchResultsByCategory from "./mapPage/searchResultsByCategory"
import { LocationSearchResult } from "../models/locationSearchResult"
import LocationCard from "./mapPage/locationCard"
import { useLocationSearchResultById } from "../hooks/useLocationSearchResultById"

const thereIsAnActiveSearch = (
  vehicles: (Vehicle | Ghost)[] | null,
  searchPageState: SearchPageState
): boolean => vehicles !== null && searchPageState.isActive

const OldSearchResultList = ({
  selectSearchResult,
}: {
  selectSearchResult: (result: Vehicle | Ghost | null) => void
}) => {
  const [{ searchPageState }] = useContext(StateDispatchContext)
  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)
  const searchVehicles = useSearchResults(
    socket,
    searchPageState.isActive ? searchPageState.query : null
  )
  return searchVehicles !== null &&
    thereIsAnActiveSearch(searchVehicles, searchPageState) ? (
    <SearchResults
      vehicles={searchVehicles}
      selectedVehicleId={null}
      onClick={selectSearchResult}
    />
  ) : (
    <RecentSearches />
  )
}

const SearchMode = ({
  onSelectVehicleResult,
  onSelectLocationResult,
}: {
  onSelectVehicleResult: (result: Vehicle | Ghost | null) => void
  onSelectLocationResult: (result: LocationSearchResult | null) => void
}): React.ReactElement => {
  const CurrentSearchForm = inTestGroup(TestGroups.LocationSearch)
    ? SearchFormFromStateDispatchContext
    : OldSearchForm

  const [{ searchPageState }] = useContext(StateDispatchContext)
  return (
    <>
      <div className="c-map-page__input u-hideable">
        <CurrentSearchForm
          formTitle="Search Map"
          inputTitle="Search Map Query"
          onSubmit={() => {
            window.FS?.event("Search submitted from map page")
          }}
        />
      </div>

      <VisualSeparator className="c-map-page__horizontal-separator" />

      <div className="c-search-display u-hideable">
        {searchPageState.isActive ? (
          inTestGroup(TestGroups.LocationSearch) ? (
            <SearchResultsByCategory
              onSelectVehicleResult={onSelectVehicleResult}
              onSelectLocationResult={onSelectLocationResult}
            />
          ) : (
            <OldSearchResultList selectSearchResult={onSelectVehicleResult} />
          )
        ) : (
          <RecentSearches />
        )}
      </div>
    </>
  )
}

const SelectedVehicle = ({
  vehicleId,
  setSelection,
}: {
  vehicleId: VehicleId
  setSelection: (selectedEntity: SelectedEntity | null) => void
}) => {
  // TODO: When using socket from context, this doesn't work as-is
  // Presumably because the useMostRecentVehicleById hook is being used twice, but
  // haven't tracked down error yet
  const { socket } = useSocket()

  const selectedVehicleOrGhost = useMostRecentVehicleById(socket, vehicleId)

  if (selectedVehicleOrGhost === null) {
    return <Loading />
  }

  const { routeId, routePatternId } = selectedVehicleOrGhost

  const onRouteClicked =
    routeId &&
    routePatternId &&
    (() =>
      setSelection({
        type: SelectedEntityType.RoutePattern,
        routeId,
        routePatternId,
      }))

  return (
    <VehiclePropertiesCard
      vehicleOrGhost={selectedVehicleOrGhost}
      key={selectedVehicleOrGhost.id}
      onRouteVariantNameClicked={onRouteClicked || undefined}
    />
  )
}

const SelectedRoute = ({
  selectedRoutePattern,
  selectRoutePattern,
}: {
  selectedRoutePattern: SelectedRoutePattern
  selectRoutePattern: (routePattern: RoutePattern) => void
}): ReactElement => {
  const routePatterns = usePatternsByIdForRoute(selectedRoutePattern.routeId)

  return routePatterns ? (
    <RoutePropertiesCard
      routePatterns={routePatterns}
      selectedRoutePatternId={selectedRoutePattern.routePatternId}
      selectRoutePattern={selectRoutePattern}
    />
  ) : (
    <Loading />
  )
}

const Selection = ({
  selectedEntity,
  setSelection,
  fetchedSelectedLocation,
}: {
  selectedEntity: SelectedEntity
  setSelection: (selectedEntity: SelectedEntity | null) => void
  fetchedSelectedLocation: LocationSearchResult | null
}): ReactElement => {
  const [{ searchPageState }, dispatch] = useContext(StateDispatchContext)
  const selectRoutePattern = (routePattern: RoutePattern) => {
    dispatch(
      setSelectedEntity({
        type: SelectedEntityType.RoutePattern,
        routeId: routePattern.routeId,
        routePatternId: routePattern.id,
      })
    )
  }

  const shouldShowBackButton =
    searchPageState.selectedEntityHistory.length > 0 ||
    searchPageState.query.text !== ""

  return (
    <div>
      <div className="c-map-page__search-actions">
        {shouldShowBackButton && (
          <button
            className="c-map-page__back-button"
            onClick={() => {
              dispatch(goBack())
            }}
          >
            <ChevronLeftIcon />
            Back
          </button>
        )}
        <button
          className="button-submit c-map-page__new-search-button"
          onClick={() => {
            dispatch(setSelectedEntity(null))
            dispatch(newSearchSession())
          }}
        >
          <SearchIcon />
          New Search
        </button>
      </div>

      <VisualSeparator className="c-map-page__horizontal-separator" />

      {selectedEntity.type === SelectedEntityType.Vehicle ? (
        <SelectedVehicle
          vehicleId={selectedEntity.vehicleId}
          setSelection={setSelection}
        />
      ) : selectedEntity.type === SelectedEntityType.RoutePattern ? (
        <SelectedRoute
          selectedRoutePattern={selectedEntity}
          selectRoutePattern={selectRoutePattern}
        />
      ) : fetchedSelectedLocation ? (
        <LocationCard
          location={fetchedSelectedLocation}
          searchSelection={true}
        />
      ) : (
        <Loading />
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
  const [searchOpen, setSearchOpen] = useState<boolean>(true)
  const toggleSearchDrawer = useCallback(
    () => setSearchOpen((open) => !open),
    [setSearchOpen]
  )
  // #endregion

  const selectedLocationById = useLocationSearchResultById(
    selectedEntity?.type === SelectedEntityType.LocationByPlaceId
      ? selectedEntity.placeId
      : null
  )

  const fetchedSelectedLocation =
    selectedEntity?.type === SelectedEntityType.Location
      ? selectedEntity.location
      : selectedLocationById

  const setVehicleSelection = useCallback(
    (selectedEntity: SelectedEntity | null) => {
      switch (selectedEntity?.type) {
        case SelectedEntityType.Vehicle:
          window.FS?.event("VPC Opened")
          break
        case SelectedEntityType.RoutePattern:
          window.FS?.event("RPC Opened")
      }
      if (selectedEntity) {
        setSearchOpen(true)
      }

      dispatch(setSelectedEntity(selectedEntity))
    },
    [dispatch]
  )

  const selectVehicleResult = useCallback(
    (vehicleOrGhost: Vehicle | Ghost | null) => {
      if (vehicleOrGhost) {
        setVehicleSelection({
          type: SelectedEntityType.Vehicle,
          vehicleId: vehicleOrGhost.id,
        })
      } else {
        setVehicleSelection(null)
      }
    },
    [setVehicleSelection]
  )

  const selectLocationResult = (
    location: LocationSearchResult | null
  ): void => {
    if (location) {
      dispatch(
        setSelectedEntity({
          type: SelectedEntityType.Location,
          location,
        })
      )
    } else {
      dispatch(setSelectedEntity(null))
    }
  }

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
        {selectedEntity ? (
          <Selection
            selectedEntity={selectedEntity}
            setSelection={setVehicleSelection}
            fetchedSelectedLocation={fetchedSelectedLocation}
          />
        ) : (
          <SearchMode
            onSelectVehicleResult={selectVehicleResult}
            onSelectLocationResult={selectLocationResult}
          />
        )}
      </div>
      <div className="c-map-page__map">
        <MapDisplay
          selectedEntity={selectedEntity}
          setSelection={setVehicleSelection}
          fetchedSelectedLocation={fetchedSelectedLocation}
        />
      </div>
    </div>
  )
}

export default MapPage
