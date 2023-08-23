import Leaflet from "leaflet"
import React, { useContext, useEffect, useState } from "react"
import { Pane, useMap } from "react-leaflet"
import { SocketContext } from "../../contexts/socketContext"
import useMostRecentVehicleById from "../../hooks/useMostRecentVehicleById"
import usePatternsByIdForRoute from "../../hooks/usePatternsByIdForRoute"
import useSocket from "../../hooks/useSocket"
import useVehiclesForRoute from "../../hooks/useVehiclesForRoute"
import { isVehicle, filterVehicles } from "../../models/vehicle"
import { Ghost, Vehicle, VehicleId } from "../../realtime"
import {
  ByRoutePatternId,
  RouteId,
  RoutePattern,
  RoutePatternId,
  Stop,
} from "../../schedule"
import {
  RoutePatternIdentifier,
  SelectedEntity,
  SelectedEntityType,
  SelectedLocation,
  SelectedRoutePattern,
} from "../../state/searchPageState"
import Map, {
  vehicleToLeafletLatLng,
  FollowerStatusClasses,
  InterruptibleFollower,
  useInteractiveFollowerState,
  drawerOffsetAutoCenter,
} from "../map"
import {
  LocationMarker,
  RouteShape,
  RouteStopMarkers,
  StopMarkers,
  VehicleMarker,
} from "../mapMarkers"
import { MapSafeAreaContext } from "../../contexts/mapSafeAreaContext"
import ZoomLevelWrapper from "../ZoomLevelWrapper"
import StreetViewModeEnabledContext from "../../contexts/streetViewModeEnabledContext"
import { streetViewUrl } from "../../util/streetViewUrl"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { setTileType } from "../../state/mapLayersState"
import { TileType } from "../../tilesetUrls"
import { LayersControl } from "../map/controls/layersControl"
import { LocationSearchResult } from "../../models/locationSearchResult"
import { useAllStops } from "../../hooks/useAllStops"

const SecondaryRouteVehicles = ({
  selectedVehicleRoute,
  selectedVehicleId,
  onVehicleSelect,
}: {
  selectedVehicleId: VehicleId | null
  selectedVehicleRoute: RouteId | null
  onVehicleSelect: (vehicle: Vehicle) => void
}) => {
  const { socket } = useSocket()
  const vehicles = useVehiclesForRoute(socket, selectedVehicleRoute)
  return (
    <>
      {filterVehicles(vehicles)
        .filter((vehicle) => vehicle.id !== selectedVehicleId)
        .map((vehicle: Vehicle) => {
          return (
            <VehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
              isPrimary={false}
              isSelected={false}
              onSelect={onVehicleSelect}
            />
          )
        })}
    </>
  )
}

const useFollowingStateWithSelectionLogic = (
  selectedVehicleId: string | null,
  selectedVehicleRef: Vehicle | Ghost | null
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

const routePatternIdentifierForSelection = (
  selectedEntity: LiveSelectedEntity | null
): { routeId: RouteId; routePatternId: RoutePatternId } | null => {
  switch (selectedEntity?.type) {
    case SelectedEntityType.RoutePattern:
      return {
        routeId: selectedEntity.routeId,
        routePatternId: selectedEntity.routePatternId,
      }
    case SelectedEntityType.Vehicle:
      return selectedEntity.vehicleOrGhost?.routeId &&
        selectedEntity.vehicleOrGhost?.routePatternId
        ? {
            routeId: selectedEntity.vehicleOrGhost.routeId,
            routePatternId: selectedEntity.vehicleOrGhost.routePatternId,
          }
        : null
    default:
      return null
  }
}
type LiveSelectedEntity =
  | SelectedRoutePattern
  | { type: SelectedEntityType.Vehicle; vehicleOrGhost: Vehicle | Ghost | null }
  | SelectedLocation
  | null

const useLiveSelectedEntity = (
  selectedEntity: SelectedEntity | null,
  fetchedSelectedLocation: LocationSearchResult | null
): LiveSelectedEntity => {
  const { socket } = useContext(SocketContext)

  const selectedVehicleOrGhost = useMostRecentVehicleById(
    socket,
    (selectedEntity?.type === SelectedEntityType.Vehicle &&
      selectedEntity.vehicleId) ||
      null
  )

  switch (selectedEntity?.type) {
    case SelectedEntityType.Vehicle:
      return {
        type: SelectedEntityType.Vehicle,
        vehicleOrGhost: selectedVehicleOrGhost,
      }
    case SelectedEntityType.RoutePattern:
      return selectedEntity // no live updates for route pattern
    case SelectedEntityType.Location:
      return selectedEntity
    case SelectedEntityType.LocationByPlaceId:
      return fetchedSelectedLocation
        ? {
            type: SelectedEntityType.Location,
            location: fetchedSelectedLocation,
          }
        : null
    default:
      return null
  }
}

const MapElementsNoSelection = ({
  setStateClasses,
}: {
  setStateClasses: (classes: string | undefined) => void
}) => {
  const followerState = useFollowingStateWithSelectionLogic(null, null)

  useEffect(() => {
    setStateClasses(FollowerStatusClasses(followerState.shouldFollow))
  }, [followerState.shouldFollow, setStateClasses])

  return (
    <InterruptibleFollower
      onUpdate={drawerOffsetAutoCenter}
      positions={[]}
      {...followerState}
    />
  )
}

const RoutePatternLayers = ({
  routePattern,
  isSelected,
}: {
  routePattern: RoutePattern
  isSelected: boolean
}): JSX.Element => {
  return routePattern.shape ? (
    <>
      <ZoomLevelWrapper>
        {(zoomLevel) => {
          return (
            <>
              {routePattern.shape && (
                <>
                  <RouteShape
                    shape={routePattern.shape}
                    isSelected={isSelected}
                  />
                  <Pane
                    name="selectedRoutePatternStops"
                    pane="markerPane"
                    style={{ zIndex: 450 }} // should be above other non-interactive elements
                  >
                    <RouteStopMarkers
                      stops={routePattern.shape.stops || []}
                      includeStopCard={true}
                      zoomLevel={zoomLevel}
                    />
                  </Pane>
                </>
              )}
            </>
          )
        }}
      </ZoomLevelWrapper>
    </>
  ) : (
    <></>
  )
}

const SelectedVehicleDataLayers = ({
  vehicleOrGhost: selectedVehicleOrGhost,
  routePatterns,
  selectVehicle,
  setStateClasses,
  stops,
}: {
  vehicleOrGhost: Vehicle | Ghost | null
  routePatterns: ByRoutePatternId<RoutePattern> | null
  selectVehicle: (vehicleOrGhost: Vehicle | Ghost) => void
  setStateClasses: (classes: string | undefined) => void
  stops: Stop[]
}) => {
  const position =
    (selectedVehicleOrGhost &&
      isVehicle(selectedVehicleOrGhost) && [
        vehicleToLeafletLatLng(selectedVehicleOrGhost),
      ]) ||
    []

  const followerState = useFollowingStateWithSelectionLogic(
    selectedVehicleOrGhost?.id || null,
    selectedVehicleOrGhost
  )

  const routePatternForVehicle =
    selectedVehicleOrGhost &&
    selectedVehicleOrGhost.routePatternId &&
    routePatterns
      ? routePatterns[selectedVehicleOrGhost.routePatternId]
      : null

  const showShapeAndStops =
    selectedVehicleOrGhost &&
    isVehicle(selectedVehicleOrGhost) &&
    !selectedVehicleOrGhost.isShuttle

  const routePatternStopIdSet = new Set(
    (routePatternForVehicle?.shape?.stops || []).map((s) => s.id)
  )

  useEffect(() => {
    setStateClasses(FollowerStatusClasses(followerState.shouldFollow))
  }, [followerState.shouldFollow, setStateClasses])

  return (
    <>
      {selectedVehicleOrGhost && (
        <>
          {isVehicle(selectedVehicleOrGhost) && (
            <>
              <VehicleMarker
                key={selectedVehicleOrGhost.id}
                vehicle={selectedVehicleOrGhost}
                isPrimary={true}
                isSelected={true}
                onSelect={selectVehicle}
              />

              {!selectedVehicleOrGhost.isShuttle && (
                <SecondaryRouteVehicles
                  selectedVehicleRoute={selectedVehicleOrGhost.routeId}
                  selectedVehicleId={selectedVehicleOrGhost.id}
                  onVehicleSelect={selectVehicle}
                />
              )}
            </>
          )}
          {showShapeAndStops && routePatternForVehicle && (
            <>
              <RoutePatternLayers
                routePattern={routePatternForVehicle}
                isSelected={false}
              />
            </>
          )}
        </>
      )}
      <NearbyStops
        stops={
          // remove stops that are being rendered separately as part of the route shape
          showShapeAndStops
            ? stops.filter((s) => !routePatternStopIdSet.has(s.id))
            : stops
        }
      />
      <InterruptibleFollower
        onUpdate={drawerOffsetAutoCenter}
        positions={position}
        {...followerState}
      />
    </>
  )
}

const SelectedRouteDataLayers = ({
  routePatternIdentifier,
  routePatterns,
  selectVehicle,
  setStateClasses,
  stops,
}: {
  routePatternIdentifier: RoutePatternIdentifier
  routePatterns: ByRoutePatternId<RoutePattern> | null
  selectVehicle: (vehicleOrGhost: Vehicle | Ghost) => void
  setStateClasses: (classes: string | undefined) => void
  stops: Stop[]
}) => {
  const selectedRoutePattern: RoutePattern | undefined = routePatterns
    ? routePatterns[routePatternIdentifier.routePatternId]
    : undefined
  const routeShapePositions = selectedRoutePattern
    ? selectedRoutePattern.shape?.points?.map((p) =>
        Leaflet.latLng(p.lat, p.lon)
      ) || []
    : []
  const followerState = useInteractiveFollowerState()

  const routePatternStopIdSet = new Set(
    (selectedRoutePattern?.shape?.stops || []).map((s) => s.id)
  )

  useEffect(() => {
    setStateClasses(FollowerStatusClasses(followerState.shouldFollow))
  }, [followerState.shouldFollow, setStateClasses])
  return (
    <>
      {selectedRoutePattern && (
        <RoutePatternLayers
          routePattern={selectedRoutePattern}
          isSelected={true}
        />
      )}
      <SecondaryRouteVehicles
        selectedVehicleRoute={routePatternIdentifier.routeId}
        selectedVehicleId={null}
        onVehicleSelect={selectVehicle}
      />
      <InterruptibleFollower
        onUpdate={drawerOffsetAutoCenter}
        positions={routeShapePositions}
        {...followerState}
      />
      <NearbyStops
        stops={stops.filter((s) => !routePatternStopIdSet.has(s.id))}
      />
    </>
  )
}

const SelectedLocationDataLayer = ({
  location,
  setStateClasses,
}: {
  location: LocationSearchResult
  setStateClasses: (classes: string | undefined) => void
}) => {
  const followerState = useInteractiveFollowerState()

  useEffect(() => {
    setStateClasses(FollowerStatusClasses(followerState.shouldFollow))
  }, [followerState.shouldFollow, setStateClasses])

  return (
    <>
      <LocationMarker location={location} selected={true} />
      <InterruptibleFollower
        onUpdate={drawerOffsetAutoCenter}
        positions={[Leaflet.latLng(location.latitude, location.longitude)]}
        {...followerState}
      />
    </>
  )
}

const DataLayers = ({
  selectedEntity,
  setSelection,
  setStateClasses,
  fetchedSelectedLocation,
}: {
  selectedEntity: SelectedEntity | null
  setSelection: (selectedEntity: SelectedEntity | null) => void
  setStateClasses: (classes: string | undefined) => void
  fetchedSelectedLocation: LocationSearchResult | null
}) => {
  const liveSelectedEntity: LiveSelectedEntity | null = useLiveSelectedEntity(
    selectedEntity,
    fetchedSelectedLocation
  )

  const stops = useAllStops() || []

  const routePatternIdentifier =
    routePatternIdentifierForSelection(liveSelectedEntity)

  const routePatterns: ByRoutePatternId<RoutePattern> | null =
    usePatternsByIdForRoute(routePatternIdentifier?.routeId || null)

  const streetViewActive = useContext(StreetViewModeEnabledContext)

  const selectVehicle: (vehicleOrGhost: Vehicle | Ghost) => void =
    !streetViewActive
      ? (vehicleOrGhost) => {
          setSelection({
            type: SelectedEntityType.Vehicle,
            vehicleId: vehicleOrGhost.id,
          })
        }
      : (vehicleOrGhost) => {
          if (isVehicle(vehicleOrGhost)) {
            const url = streetViewUrl({
              latitude: vehicleOrGhost.latitude,
              longitude: vehicleOrGhost.longitude,
              bearing: vehicleOrGhost.bearing,
            })

            window.FS?.event("User clicked map vehicle to open street view", {
              streetViewUrl_str: url,
              clickedMapAt: {
                latitude_real: vehicleOrGhost.latitude,
                longitude_real: vehicleOrGhost.longitude,
                bearing_real: vehicleOrGhost.bearing,
              },
            })

            window.open(url, "_blank")
          }
        }

  switch (liveSelectedEntity?.type) {
    case SelectedEntityType.Vehicle:
      return (
        <SelectedVehicleDataLayers
          vehicleOrGhost={liveSelectedEntity.vehicleOrGhost}
          routePatterns={routePatterns}
          selectVehicle={selectVehicle}
          setStateClasses={setStateClasses}
          stops={stops}
        />
      )
    case SelectedEntityType.RoutePattern:
      return (
        <SelectedRouteDataLayers
          routePatternIdentifier={{
            routeId: liveSelectedEntity.routeId,
            routePatternId: liveSelectedEntity.routePatternId,
          }}
          routePatterns={routePatterns}
          selectVehicle={selectVehicle}
          setStateClasses={setStateClasses}
          stops={stops}
        />
      )
    case SelectedEntityType.Location:
      return (
        <>
          <NearbyStops stops={stops} />
          <SelectedLocationDataLayer
            location={liveSelectedEntity.location}
            setStateClasses={setStateClasses}
          />
        </>
      )
    default:
      return (
        <>
          <NearbyStops stops={stops} />
          <MapElementsNoSelection setStateClasses={setStateClasses} />
        </>
      )
  }
}

const NearbyStops = ({ stops }: { stops: Stop[] }) => {
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([])
  const map = useMap()
  map.addEventListener("moveend", () => {
    const bounds = map.getBounds()
    setNearbyStops(stops?.filter((s) => bounds.contains([s.lat, s.lon])) || [])
  })

  return (
    <>
      <ZoomLevelWrapper>
        {(zoomLevel) => {
          return (
            <StopMarkers
              stops={nearbyStops}
              zoomLevel={zoomLevel}
              includeStopCard={true}
            />
          )
        }}
      </ZoomLevelWrapper>
    </>
  )
}

const MapDisplay = ({
  selectedEntity,
  setSelection,
  streetViewInitiallyEnabled = false,
  fetchedSelectedLocation,
}: {
  selectedEntity: SelectedEntity | null
  setSelection: (selectedEntity: SelectedEntity | null) => void
  streetViewInitiallyEnabled?: boolean
  fetchedSelectedLocation: LocationSearchResult | null
}) => {
  const [stateClasses, setStateClasses] = useState<string | undefined>(
    undefined
  )
  const [
    {
      mapLayers: {
        searchMap: { tileType: tileType },
      },
    },
    dispatch,
  ] = useContext(StateDispatchContext)

  return (
    <Map
      vehicles={[]}
      allowStreetView={true}
      includeStopCard={true}
      shapes={[]}
      stateClasses={stateClasses}
      streetViewInitiallyEnabled={streetViewInitiallyEnabled}
      tileType={tileType}
    >
      <MapSafeAreaContext.Provider
        value={{
          paddingTopLeft: [445, 54],
          paddingBottomRight: [50, 20],
        }}
      >
        <DataLayers
          selectedEntity={selectedEntity}
          setSelection={setSelection}
          setStateClasses={setStateClasses}
          fetchedSelectedLocation={fetchedSelectedLocation}
        />
        <LayersControl.WithTileContext
          setTileType={(tileType: TileType) =>
            dispatch(setTileType("searchMap", tileType))
          }
        />
      </MapSafeAreaContext.Provider>
    </Map>
  )
}

export default MapDisplay
