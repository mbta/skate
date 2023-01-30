import { Bounds, Point } from "leaflet"
import { Socket } from "phoenix"
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { SocketContext } from "../../contexts/socketContext"
import useRoutePatterns from "../../hooks/useRoutePatterns"
import useSocket from "../../hooks/useSocket"
import { useStations } from "../../hooks/useStations"
import useVehicleForId from "../../hooks/useVehicleForId"
import useVehiclesForRoute from "../../hooks/useVehiclesForRoute"
import { isVehicle, isGhost, filterVehicles } from "../../models/vehicle"
import { Vehicle, VehicleId, VehicleOrGhost } from "../../realtime"
import { RouteId, RoutePattern, RoutePatternId } from "../../schedule"
import {
  SelectedEntity,
  SelectedEntityType,
  SelectedRoute,
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
import { RouteShape, VehicleMarker } from "../mapMarkers"
import VehiclePropertiesCard from "./vehiclePropertiesCard"

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

const selectedEntityRoutePattern = (
  selectedEntity: LiveSelectedEntity | null
): { routeId: RouteId; routePatternId: RoutePatternId | null } | null => {
  switch (selectedEntity?.type) {
    case SelectedEntityType.ROUTE:
      return {
        routeId: selectedEntity.routeId,
        routePatternId: selectedEntity.routePatternId,
      }
    case SelectedEntityType.VEHICLE:
      return selectedEntity.vehicleOrGhost?.routeId
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
  | SelectedRoute
  | { type: SelectedEntityType.VEHICLE; vehicleOrGhost: VehicleOrGhost | null }
  | null

const liveSelectedEntityData = (
  selectedEntity: SelectedEntity | null
): LiveSelectedEntity => {
  const { socket } = useContext(SocketContext)

  const selectedVehicleOrGhost = useMostRecentVehicleById(
    socket,
    (selectedEntity?.type === SelectedEntityType.VEHICLE &&
      selectedEntity.vehicleId) ||
      null
  )

  switch (selectedEntity?.type) {
    case SelectedEntityType.VEHICLE:
      return {
        type: SelectedEntityType.VEHICLE,
        vehicleOrGhost: selectedVehicleOrGhost,
      }
    case SelectedEntityType.ROUTE:
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
  }, [followerState.shouldFollow])

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
  return (
    <div className="m-map-display__selected-entity-card-container">
      {children}
    </div>
  )
}

const SelectedVehicleDataLayers = ({
  vehicleOrGhost: selectedVehicleOrGhost,
  showSelectionCard,
  deleteSelection,
  routePattern,
  selectVehicle,
  setStateClasses,
}: {
  vehicleOrGhost: VehicleOrGhost | null
  showSelectionCard: boolean
  routePattern: RoutePattern | null
  deleteSelection: () => void
  selectVehicle: (vehicleOrGhost: VehicleOrGhost) => void
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

  const routePatternShape =
    selectedVehicleOrGhost &&
    (isGhost(selectedVehicleOrGhost) || selectedVehicleOrGhost?.isShuttle)
      ? null
      : routePattern?.shape

  useEffect(() => {
    setStateClasses(FollowerStatusClasses(followerState.shouldFollow))
  }, [followerState.shouldFollow])

  return (
    <>
      {selectedVehicleOrGhost && (
        <>
          {showSelectionCard && (
            <SelectionCardContainer>
              <VehiclePropertiesCard
                vehicleOrGhost={selectedVehicleOrGhost}
                onClose={deleteSelection}
              />
            </SelectionCardContainer>
          )}
          {routePatternShape && <RouteShape shape={routePatternShape} />}
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

const SelectionDataLayers = ({
  liveSelectedEntity,
  showSelectionCard,
  deleteSelection,
  selectedRoutePattern,
  setSelection,
  setStateClasses,
}: {
  liveSelectedEntity: LiveSelectedEntity | null
  showSelectionCard: boolean
  selectedRoutePattern: RoutePattern | null
  deleteSelection: () => void
  setSelection: (selectedEntity: SelectedEntity | null) => void
  setStateClasses: (classes: string | undefined) => void
}) => {
  switch (liveSelectedEntity?.type) {
    case SelectedEntityType.VEHICLE:
      return (
        <SelectedVehicleDataLayers
          vehicleOrGhost={liveSelectedEntity.vehicleOrGhost}
          showSelectionCard={showSelectionCard}
          routePattern={selectedRoutePattern}
          deleteSelection={deleteSelection}
          selectVehicle={(vehicleOrGhost: VehicleOrGhost) =>
            setSelection({
              type: SelectedEntityType.VEHICLE,
              vehicleId: vehicleOrGhost.id,
            })
          }
          setStateClasses={setStateClasses}
        />
      )
    // TODO: handle SelectedEntityType.ROUTE
    default:
      return <MapElementsNoSelection setStateClasses={setStateClasses} />
  }
}

const useSelectedEntityRoutePatterns = (
  liveSelectedEntity: LiveSelectedEntity | null
): [RoutePattern[] | null, RoutePattern | null] => {
  const selectedEntityRouteData = selectedEntityRoutePattern(liveSelectedEntity)
  const routePatterns: RoutePattern[] | null = useRoutePatterns(
    selectedEntityRouteData?.routeId || null
  )

  const routePatternOfSelectedEntity =
    (routePatterns &&
      selectedEntityRouteData?.routePatternId &&
      routePatterns?.find(
        (rp) => rp.id === selectedEntityRouteData.routePatternId
      )) ||
    null

  return [routePatterns, routePatternOfSelectedEntity]
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

  const liveSelectedEntity: LiveSelectedEntity | null =
    liveSelectedEntityData(selectedEntity)

  const [_routePatterns, selectedEntityRoutePattern] =
    useSelectedEntityRoutePatterns(liveSelectedEntity)

  const [stateClasses, setStateClasses] = useState<string | undefined>(
    undefined
  )

  return (
    <BaseMap
      vehicles={[]}
      allowStreetView={true}
      stopCardDirection={selectedEntityRoutePattern?.directionId}
      includeStopCard={true}
      stations={stations}
      shapes={
        selectedEntityRoutePattern?.shape
          ? [selectedEntityRoutePattern?.shape]
          : []
      }
      stateClasses={stateClasses}
    >
      <>
        {
          <SelectionDataLayers
            liveSelectedEntity={liveSelectedEntity}
            showSelectionCard={showSelectionCard}
            deleteSelection={deleteSelection}
            setSelection={setSelection}
            selectedRoutePattern={selectedEntityRoutePattern}
            setStateClasses={setStateClasses}
          />
        }
      </>
    </BaseMap>
  )
}

export default MapDisplay
