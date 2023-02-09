import Leaflet, { Bounds, Point } from "leaflet"
import React, {
  ComponentPropsWithoutRef,
  MouseEventHandler,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { SocketContext } from "../../contexts/socketContext"
import useMostRecentVehicleById from "../../hooks/useMosRecentVehicleById"
import usePatternsByIdForRoute from "../../hooks/usePatternsByIdForRoute"
import useSocket from "../../hooks/useSocket"
import { useStations } from "../../hooks/useStations"
import useVehiclesForRoute from "../../hooks/useVehiclesForRoute"
import { isVehicle, filterVehicles } from "../../models/vehicle"
import { Vehicle, VehicleId, VehicleOrGhost } from "../../realtime"
import {
  ByRoutePatternId,
  RouteId,
  RoutePattern,
  RoutePatternId,
} from "../../schedule"
import {
  RoutePatternIdentifier,
  SelectedEntity,
  SelectedEntityType,
  SelectedRoutePattern,
} from "../../state/searchPageState"
import {
  vehicleToLeafletLatLng,
  BaseMap,
  FollowerStatusClasses,
  InterruptibleFollower,
  defaultCenter,
  UpdateMapFromPointsFn,
  useInteractiveFollowerState,
} from "../map"
import { RouteShape, RouteStopMarkers, VehicleMarker } from "../mapMarkers"
import ZoomLevelWrapper from "../ZoomLevelWrapper"
import RoutePropertiesCard from "./routePropertiesCard"
import VehiclePropertiesCard from "./vehiclePropertiesCard"

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

  if (points.length === 1) {
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
  } else {
    const pointsBounds = Leaflet.latLngBounds(points)
    map.fitBounds(pointsBounds, {
      paddingBottomRight: [20, 50],
      paddingTopLeft: topLeft,
    })
  }
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
  | { type: SelectedEntityType.Vehicle; vehicleOrGhost: VehicleOrGhost | null }
  | null

const useLiveSelectedEntity = (
  selectedEntity: SelectedEntity | null
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
      onUpdate={onFollowerUpdate}
      positions={[]}
      {...followerState}
    />
  )
}

const SelectionCardContainer = ({
  children,
}: {
  children: JSX.Element
}): JSX.Element => {
  // #region Catching Events Before Leaflet
  const cancelEvent: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation()
  }

  const keepUserInputFromLeaflet: ComponentPropsWithoutRef<"div"> = {
    onMouseDownCapture: cancelEvent,
    onDoubleClickCapture: cancelEvent,
    onScrollCapture: cancelEvent,
    onWheelCapture: cancelEvent,
  }
  // #endregion
  return (
    <div
      {...keepUserInputFromLeaflet}
      className="m-map-display__selected-entity-card-container"
    >
      {children}
    </div>
  )
}

const RoutePatternLayers = ({
  routePattern,
  onShapeClick,
}: {
  routePattern: RoutePattern
  onShapeClick: () => void
}): JSX.Element => {
  return routePattern.shape ? (
    <>
      <RouteShape shape={routePattern.shape} onClick={onShapeClick} />
      <ZoomLevelWrapper>
        {(zoomLevel) => {
          return (
            <>
              {routePattern.shape && (
                <RouteStopMarkers
                  stops={routePattern.shape.stops || []}
                  includeStopCard={true}
                  direction={routePattern.directionId}
                  zoomLevel={zoomLevel}
                />
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
  showSelectionCard,
  selectVehicle,
  selectRoutePattern,
  deleteSelection,
  setStateClasses,
}: {
  vehicleOrGhost: VehicleOrGhost | null
  routePatterns: ByRoutePatternId<RoutePattern> | null
  showSelectionCard: boolean
  selectVehicle: (vehicleOrGhost: VehicleOrGhost) => void
  selectRoutePattern: (routePattern: RoutePattern) => void
  deleteSelection: () => void
  setStateClasses: (classes: string | undefined) => void
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

  useEffect(() => {
    setStateClasses(FollowerStatusClasses(followerState.shouldFollow))
  }, [followerState.shouldFollow, setStateClasses])

  return (
    <>
      {selectedVehicleOrGhost && (
        <>
          {showSelectionCard && (
            <SelectionCardContainer>
              <VehiclePropertiesCard
                vehicleOrGhost={selectedVehicleOrGhost}
                onClose={deleteSelection}
                key={selectedVehicleOrGhost.id}
              />
            </SelectionCardContainer>
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
                selectedVehicleRoute={selectedVehicleOrGhost.routeId}
                selectedVehicleId={selectedVehicleOrGhost.id}
                onPrimaryVehicleSelect={selectVehicle}
              />
            ))}
          {showShapeAndStops && routePatternForVehicle && (
            <RoutePatternLayers
              routePattern={routePatternForVehicle}
              onShapeClick={() => selectRoutePattern(routePatternForVehicle)}
            />
          )}
        </>
      )}

      <InterruptibleFollower
        onUpdate={onFollowerUpdate}
        positions={position}
        {...followerState}
      />
    </>
  )
}

const SelectedRouteDataLayers = ({
  routePatternIdentifier,
  routePatterns,
  showSelectionCard,
  deleteSelection,
  selectVehicle,
  selectRoutePattern,
  setStateClasses,
}: {
  routePatternIdentifier: RoutePatternIdentifier
  routePatterns: ByRoutePatternId<RoutePattern> | null
  showSelectionCard: boolean
  selectVehicle: (vehicleOrGhost: VehicleOrGhost) => void
  selectRoutePattern: (routePattern: RoutePattern) => void
  deleteSelection: () => void

  setStateClasses: (classes: string | undefined) => void
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

  useEffect(() => {
    setStateClasses(FollowerStatusClasses(followerState.shouldFollow))
  }, [followerState.shouldFollow, setStateClasses])
  return (
    <>
      {showSelectionCard && routePatterns && (
        <SelectionCardContainer>
          <RoutePropertiesCard
            selectedRoutePatternId={routePatternIdentifier.routePatternId}
            routePatterns={routePatterns}
            selectRoutePattern={selectRoutePattern}
            onClose={deleteSelection}
          />
        </SelectionCardContainer>
      )}
      {selectedRoutePattern && (
        <RoutePatternLayers
          routePattern={selectedRoutePattern}
          onShapeClick={() => selectRoutePattern(selectedRoutePattern)}
        />
      )}
      <RouteVehicles
        selectedVehicleRoute={routePatternIdentifier.routeId}
        selectedVehicleId={null}
        onPrimaryVehicleSelect={selectVehicle}
      />
      <InterruptibleFollower
        onUpdate={onFollowerUpdate}
        positions={routeShapePositions}
        {...followerState}
      />
    </>
  )
}

const SelectionDataLayers = ({
  selectedEntity,
  showSelectionCard,
  deleteSelection,
  setSelection,
  setStateClasses,
}: {
  selectedEntity: SelectedEntity | null
  showSelectionCard: boolean
  deleteSelection: () => void
  setSelection: (selectedEntity: SelectedEntity | null) => void
  setStateClasses: (classes: string | undefined) => void
}) => {
  const liveSelectedEntity: LiveSelectedEntity | null =
    useLiveSelectedEntity(selectedEntity)

  const routePatternIdentifier =
    routePatternIdentifierForSelection(liveSelectedEntity)

  const routePatterns: ByRoutePatternId<RoutePattern> | null =
    usePatternsByIdForRoute(routePatternIdentifier?.routeId || null)

  const selectVehicle = (vehicleOrGhost: VehicleOrGhost) =>
    setSelection({
      type: SelectedEntityType.Vehicle,
      vehicleId: vehicleOrGhost.id,
    })

  const selectRoutePattern = (routePattern: RoutePattern) => {
    setSelection({
      type: SelectedEntityType.RoutePattern,
      routeId: routePattern.routeId,
      routePatternId: routePattern.id,
    })
  }

  switch (liveSelectedEntity?.type) {
    case SelectedEntityType.Vehicle:
      return (
        <SelectedVehicleDataLayers
          vehicleOrGhost={liveSelectedEntity.vehicleOrGhost}
          routePatterns={routePatterns}
          showSelectionCard={showSelectionCard}
          selectVehicle={selectVehicle}
          selectRoutePattern={selectRoutePattern}
          deleteSelection={deleteSelection}
          setStateClasses={setStateClasses}
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
          showSelectionCard={showSelectionCard}
          selectVehicle={selectVehicle}
          selectRoutePattern={selectRoutePattern}
          deleteSelection={deleteSelection}
          setStateClasses={setStateClasses}
        />
      )
    default:
      return <MapElementsNoSelection setStateClasses={setStateClasses} />
  }
}

const MapDisplay = ({
  selectedEntity,
  setSelection,
  showSelectionCard,
}: {
  selectedEntity: SelectedEntity | null
  setSelection: (selectedEntity: SelectedEntity | null) => void
  showSelectionCard: boolean
}) => {
  const deleteSelection = useCallback(() => {
    setSelection && setSelection(null)
  }, [setSelection])

  const stations = useStations()

  const [stateClasses, setStateClasses] = useState<string | undefined>(
    undefined
  )

  return (
    <BaseMap
      vehicles={[]}
      allowStreetView={true}
      includeStopCard={true}
      stations={stations}
      shapes={[]}
      stateClasses={stateClasses}
    >
      <SelectionDataLayers
        selectedEntity={selectedEntity}
        showSelectionCard={showSelectionCard}
        deleteSelection={deleteSelection}
        setSelection={setSelection}
        setStateClasses={setStateClasses}
      />
    </BaseMap>
  )
}

export default MapDisplay
