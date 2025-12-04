import Leaflet, {
  Bounds,
  LatLng,
  LatLngExpression,
  Map as LeafletMap,
  PointExpression,
} from "leaflet"
import React, {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useMap, useMapEvents } from "react-leaflet"
import { StateDispatchContext } from "../../contexts/stateDispatchContext"
import { equalByElements } from "../../helpers/array"
import { RecenterControl } from "./controls/recenterControl"
import { defaultCenter } from "../map"

export type UpdateMapFromPointsFn = (map: LeafletMap, points: LatLng[]) => void

export interface FollowerProps {
  positions: LatLng[]
  onUpdate?: UpdateMapFromPointsFn
}

export const Follower = ({
  positions,
  onUpdate,
  isAnimatingFollowUpdate,
  shouldFollow = true,
}: FollowerProps & InteractiveFollowState) => {
  const map = useMap()
  function isValidLatLng(p: LatLng | null | undefined): p is LatLng {
    return (
      !!p &&
      typeof (p as any).lat === "number" &&
      typeof (p as any).lng === "number" &&
      Number.isFinite((p as any).lat) &&
      Number.isFinite((p as any).lng)
    )
  }

  const validPositions = (positions || []).filter(isValidLatLng)

  const [currentLatLngs, setCurrentLatLngs] = useState<LatLng[]>(validPositions)

  // Sync state from validated positions inside an effect (avoid setState during render)
  useEffect(() => {
    if (
      !equalByElements(validPositions, currentLatLngs, (lhs, rhs) =>
        lhs.equals(rhs)
      )
    ) {
      setCurrentLatLngs(validPositions)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(validPositions)])

  useEffect(() => {
    if (map !== null && shouldFollow) {
      if (isAnimatingFollowUpdate !== undefined) {
        isAnimatingFollowUpdate.current = true
      }
      // always call onUpdate with validated positions
      onUpdate?.(map, currentLatLngs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, shouldFollow, isAnimatingFollowUpdate, currentLatLngs, onUpdate])

  return null
}

// #region Follower Helper Hooks
export interface InteractiveFollowState {
  isAnimatingFollowUpdate: MutableRefObject<boolean>
  shouldFollow: boolean
  setShouldFollow: Dispatch<SetStateAction<boolean>>
}
// Gathers all state needed for the Follower to be able to display its state
// as well as support turning off when interrupted

export const useInteractiveFollowerState = (
  initEnabled = true
): InteractiveFollowState => {
  const [shouldFollow, setShouldFollow] = useState<boolean>(initEnabled)
  const isAnimatingFollowUpdate: MutableRefObject<boolean> = useRef(false)

  return {
    shouldFollow,
    setShouldFollow,
    isAnimatingFollowUpdate,
  }
}
// Sets up map events to get a callback when the user interacts with the map
// which should override the follower on state

export const useStopFollowingOnInteraction = (
  isAnimatingFollowUpdate: React.MutableRefObject<boolean>,
  setShouldFollow: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useMapEvents({
    // If the user drags or zooms, they want manual control of the map.
    // `zoomstart` is fired when the map changes zoom levels
    // this can be because of animating the zoom change or user input
    zoomstart: () => {
      // But don't disable `shouldFollow` if the zoom was triggered by Follower.
      if (!isAnimatingFollowUpdate.current) {
        setShouldFollow(false)
      }
    },

    // `dragstart` is fired when a user drags the map
    // it is expected that this event is not fired for anything but user input
    // by [handler/Map.Drag.js](https://github.com/Leaflet/Leaflet/blob/6b90c169d6cd11437bfbcc8ba261255e009afee3/src/map/handler/Map.Drag.js#L113-L115)
    dragstart: () => {
      setShouldFollow(false)
    },

    // `moveend` is called when the leaflet map has finished animating a pan
    moveend: () => {
      // Wait until the `Follower` `setView` animation is finished to resume listening for user interaction.
      if (isAnimatingFollowUpdate.current) {
        isAnimatingFollowUpdate.current = false
      }
    },

    // `autopanstart` is invoked when opening a popup causes the map to pan to fit it
    autopanstart: () => setShouldFollow(false),
  })
}
// #endregion Follower Helper Hooks

// #region Follower Variants
// Component which provides following capability and configures the map to stop
// the follower component when a user interacts with the map

export type InterruptibleFollowerProps = InteractiveFollowState & FollowerProps

export const InterruptibleFollower = (props: InterruptibleFollowerProps) => {
  useStopFollowingOnInteraction(
    props.isAnimatingFollowUpdate,
    props.setShouldFollow
  )

  return <Follower {...props} />
}

export const StatefulInteractiveFollower = (props: FollowerProps) => {
  return <InterruptibleFollower {...props} {...useInteractiveFollowerState()} />
}

export const RecenterControlWithInterruptibleFollower = (
  props: InterruptibleFollowerProps
) => (
  <>
    <InterruptibleFollower {...props} />
    <RecenterControl
      position="topright"
      active={props.shouldFollow}
      onActivate={() => props.setShouldFollow(true)}
    />
  </>
)
// #endregion Follower Variants

// #region Follower Update Functions

export const autoCenter = (
  map: LeafletMap,
  latLngs: LatLngExpression[],
  pickerContainerIsVisible: boolean
): void => {
  const validLatLngs = latLngs.filter((latLng) => {
    if (Array.isArray(latLng)) {
      return !isNaN(latLng[0]) && !isNaN(latLng[1])
    }
    const ll = latLng as LatLng
    return !isNaN(ll.lat) && !isNaN(ll.lng)
  })

  if (validLatLngs.length === 0) {
    map.setView(defaultCenter, 13, { animate: false })
  } else if (validLatLngs.length === 1) {
    map.setView(validLatLngs[0], 16)
  } else if (validLatLngs.length > 1) {
    map.fitBounds(Leaflet.latLngBounds(validLatLngs), {
      paddingBottomRight: [20, 50],
      paddingTopLeft: [pickerContainerIsVisible ? 220 : 20, 20],
    })
  }
}

export const usePickerContainerFollowerFn = () => {
  const [{ pickerContainerIsVisible }] = useContext(StateDispatchContext)

  const onUpdate = useCallback(
    (map: Leaflet.Map, points: Leaflet.LatLng[]): void =>
      autoCenter(map, points, pickerContainerIsVisible),
    [pickerContainerIsVisible]
  )

  return onUpdate
}

export const drawerOffsetAutoCenter =
  (useCurrentZoom: boolean, topLeft: PointExpression): UpdateMapFromPointsFn =>
  (map, points) => {
    // Filter out invalid points
    const validPoints = points.filter(
      (point) => !isNaN(point.lat) && !isNaN(point.lng)
    )

    if (validPoints.length === 0) {
      // If there are no valid points, blink to default center
      map.setView(defaultCenter, 13, { animate: false })
      return
    }

    const { width, height } = map.getContainer().getBoundingClientRect()
    const mapContainerBounds = new Bounds([0, 0], [width, height])

    if (validPoints.length === 1) {
      const currentZoom = map.getZoom()
      const targetZoom = useCurrentZoom && currentZoom >= 13 ? currentZoom : 16
      const innerBounds = new Bounds(
        topLeft,
        mapContainerBounds.getBottomRight()
      )
      // The "new center" is the offset between the two bounding boxes centers
      const offset = innerBounds
        .getCenter()
        .subtract(mapContainerBounds.getCenter())

      const targetPoint = map
          // Project the target point into screenspace for the target zoom
          .project(validPoints[0], targetZoom)
          // Offset the target point in screenspace to move the center of the map
          // to apply the padding to the center
          .subtract(offset),
        // convert the target point to worldspace from screenspace
        targetLatLng = map.unproject(targetPoint, targetZoom)

      // Zoom/Pan center of map to offset location in worldspace
      map.setView(targetLatLng, targetZoom)
    } else {
      const pointsBounds = Leaflet.latLngBounds(validPoints)
      map.fitBounds(pointsBounds, {
        paddingBottomRight: [50, 20],
        paddingTopLeft: topLeft,
      })
    }
  }

export const fixedZoomDrawerOffsetAutoCenter = (
  topLeft: PointExpression | undefined
) => drawerOffsetAutoCenter(false, topLeft || [0, 0])

// #endregion Follower Update Functions
