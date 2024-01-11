import { LatLng, LatLngLiteral } from "leaflet"

/**
 * A helper function to help clarify code when clamping a value between a range.
 * (Remove when tc39 implements `Math.clamp`)
 *
 * @returns {} {@link value} limited to the range defined by {@link min} and
 * {@link max}
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(min, value), max)

interface ClosestPosition {
  position: LatLngLiteral
  index: number
  distance: number
}

/**
 * Finds the element in {@link positions} that is closest to {@link point}
 * @param positions List of coordinates to search
 * @param point Point of reference to check distance to
 * @returns
 * if {@link positions} is empty, returns `undefined`
 *
 * Otherwise, returns a {@link ClosestPosition} object containing
 * - {@link ClosestPosition.position}: the closest element in {@link positions} to {@link point}
 * - {@link ClosestPosition.index}: the index of the element in {@link positions}
 * - {@link ClosestPosition.distance}: the distance to {@link point}
 */
export const closestPosition = (
  positions: LatLngLiteral[],
  point: LatLng
): ClosestPosition | undefined => {
  const positionsByDistance = positions
    .map((currentPosition, index) => ({
      distance: point.distanceTo(currentPosition),
      position: currentPosition,
      index,
    }))
    .sort((lhs, rhs) => lhs.distance - rhs.distance)

  return positionsByDistance[0] ?? undefined

  /**
   * In the future, we may want to be able to snap to the line _line_ formed
   * by {@link positions}.
   * (in the case of, e.g., a low resolution line formed by {@link positions}).
   *
   * Now that we have the sorted {@link positionsByDistance}, we can interpolate
   * the two closest points with respect to {@link point} to find the closest
   * point on the line.
   */
}
