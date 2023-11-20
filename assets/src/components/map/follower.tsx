import Leaflet, {
  Bounds,
  LatLng,
  LatLngExpression,
  Map as LeafletMap,
  Point,
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
  const [currentLatLngs, setCurrentLatLngs] = useState<LatLng[]>(positions)

  if (
    !equalByElements(positions, currentLatLngs, (lhs, rhs) => lhs.equals(rhs))
  ) {
    setCurrentLatLngs(positions)
  }

  useEffect(() => {
    if (map !== null && shouldFollow) {
      if (isAnimatingFollowUpdate !== undefined) {
        isAnimatingFollowUpdate.current = true
      }
      onUpdate?.(map, currentLatLngs)
    }
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
  if (latLngs.length === 0) {
    map.setView(defaultCenter, 13, { animate: false })
  } else if (latLngs.length === 1) {
    map.setView(latLngs[0], 16)
  } else if (latLngs.length > 1) {
    map.fitBounds(Leaflet.latLngBounds(latLngs), {
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
  (useCurrentZoom: boolean, shouldOffset: boolean): UpdateMapFromPointsFn =>
  (map, points) => {
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
    const topLeft = new Point(shouldOffset ? 445 : 0, 0)

    if (points.length === 1) {
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
        paddingBottomRight: [50, 20],
        paddingTopLeft: topLeft,
      })
    }
  }

export const fixedZoomDrawerOffsetAutoCenter = drawerOffsetAutoCenter(
  false,
  true
)

// #endregion Follower Update Functions
