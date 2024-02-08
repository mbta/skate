import React, { ReactElement, useCallback, useContext, useState } from "react"

import { MapSafeAreaContext } from "../contexts/mapSafeAreaContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { joinClasses } from "../helpers/dom"
import { ChevronLeftIcon, SearchIcon } from "../helpers/icon"
import useMostRecentVehicleById from "../hooks/useMostRecentVehicleById"
import usePatternsByIdForRoute from "../hooks/usePatternsByIdForRoute"
import useScreenSize from "../hooks/useScreenSize"
import useSocket from "../hooks/useSocket"
import { Ghost, Vehicle, VehicleId } from "../realtime"
import { RoutePattern } from "../schedule"
import {
  goBack,
  newSearchSession,
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
import { VisualSeparator } from "./visualSeparator"
import SearchResultsByCategory from "./mapPage/searchResultsByCategory"
import { LocationSearchResult } from "../models/locationSearchResult"
import LocationCard from "./mapPage/locationCard"
import { useLocationSearchResultById } from "../hooks/useLocationSearchResultById"
import { fullStoryEvent } from "../helpers/fullStory"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"
import { StartDetourProps } from "./detours/detourDropdown"
import { DetourModal } from "./detours/detourModal"

const SearchMode = ({
  onSelectVehicleResult,
  onSelectLocationResult,
}: {
  onSelectVehicleResult: (result: Vehicle | Ghost | null) => void
  onSelectLocationResult: (result: LocationSearchResult | null) => void
}): React.ReactElement => {
  const [{ searchPageState }] = useContext(StateDispatchContext)
  return (
    <>
      <div className="c-map-page__input u-hideable">
        <SearchFormFromStateDispatchContext
          onSubmit={() => {
            fullStoryEvent("Search submitted from map page", {})
          }}
        />
      </div>

      <VisualSeparator className="c-map-page__horizontal-separator" />

      <div className="c-search-display u-hideable">
        {searchPageState.isActive ? (
          <SearchResultsByCategory
            onSelectVehicleResult={onSelectVehicleResult}
            onSelectLocationResult={onSelectLocationResult}
          />
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
  onRunClicked,
}: {
  vehicleId: VehicleId
  setSelection: (selectedEntity: SelectedEntity | null) => void
  onRunClicked?: (vehicleOrGhost: Vehicle | Ghost) => void
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
      onRunClick={onRunClicked}
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
  onVehicleRunClicked,
}: {
  selectedEntity: SelectedEntity
  setSelection: (selectedEntity: SelectedEntity | null) => void
  fetchedSelectedLocation: LocationSearchResult | null
  onVehicleRunClicked?: (vehicleOrGhost: Vehicle | Ghost) => void
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
          onRunClicked={onVehicleRunClicked}
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
  const [followerShouldSetZoomLevel, setFollowerShouldSetZoomLevel] =
    useState<boolean>(true)

  const [{ searchPageState }, dispatch] = useContext(StateDispatchContext),
    { selectedEntity = null } = searchPageState

  const deviceType = useScreenSize()
  const isMobile =
    deviceType === "mobile" || deviceType === "mobile_landscape_tablet_portrait"
  const defaultSearchOpen = !selectedEntity || !isMobile

  const { openVehiclePropertiesPanel } = usePanelStateFromStateDispatchContext()

  // #region Search Drawer Logic
  const [searchOpen, setSearchOpen] = useState<boolean>(defaultSearchOpen)

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
          fullStoryEvent("VPC Opened", {})
          break
        case SelectedEntityType.RoutePattern:
          fullStoryEvent("RPC Opened", {})
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
        setSearchOpen(!isMobile)
      } else {
        setVehicleSelection(null)
      }
    },
    [setVehicleSelection, isMobile]
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
      setSearchOpen(!isMobile)
    } else {
      dispatch(setSelectedEntity(null))
    }
  }

  const [detourInfo, setDetourInfo] = useState<StartDetourProps | null>(null)

  const onStartDetour = (props: StartDetourProps) => {
    setDetourInfo(props)
  }

  return (
    <>
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
              setSelection={(...args) => {
                setFollowerShouldSetZoomLevel(false)
                setVehicleSelection(...args)
              }}
              fetchedSelectedLocation={fetchedSelectedLocation}
              onVehicleRunClicked={(vehicleOrGhost: Vehicle | Ghost) =>
                openVehiclePropertiesPanel(vehicleOrGhost, "run")
              }
            />
          ) : (
            <SearchMode
              onSelectVehicleResult={(...args) => {
                setFollowerShouldSetZoomLevel(true)
                selectVehicleResult(...args)
              }}
              onSelectLocationResult={selectLocationResult}
            />
          )}
        </div>
        <button
          onClick={toggleSearchDrawer}
          className="c-map-page__panel-backdrop-button"
        />
        <div className="c-map-page__map">
          <MapSafeAreaContext.Provider
            value={{
              paddingTopLeft: [searchOpen ? 445 : 54, 54],
              paddingBottomRight: [50, 20],
            }}
          >
            <MapDisplay
              selectedEntity={selectedEntity}
              setSelection={(...args) => {
                setFollowerShouldSetZoomLevel(false)
                setVehicleSelection(...args)
                setSearchOpen(true)
              }}
              fetchedSelectedLocation={fetchedSelectedLocation}
              initializeRouteFollowerEnabled={
                followerShouldSetZoomLevel === true
              }
              vehicleUseCurrentZoom={followerShouldSetZoomLevel === false}
              onInterruptVehicleFollower={
                (followerShouldSetZoomLevel === false || undefined) &&
                (() => {
                  setFollowerShouldSetZoomLevel(false)
                })
              }
              onStartDetour={onStartDetour}
            />
          </MapSafeAreaContext.Provider>
        </div>
        {detourInfo && (
          <DetourModal
            detourInfo={detourInfo}
            onClose={() => {
              setDetourInfo(null)
            }}
          />
        )}
      </div>
    </>
  )
}

export default MapPage
