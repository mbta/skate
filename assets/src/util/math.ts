import { LatLng, LatLngExpression } from "leaflet"

/**
 * A helper function to help clarify code when clamping a value between a range.
 * (Remove when tc39 implements `Math.clamp`)
 *
 * @returns {} {@link value} limited to the range defined by {@link min} and
 * {@link max}
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(min, value), max)

/**
 * Finds the element in {@link positions} that is closest to {@link point}
 * @param positions List of coordinates to search
 * @param point Point of reference to check distance to
 * @returns The closest point in {@link positions} to {@link point}
 */
export const closestPosition = (
  positions: LatLngExpression[],
  point: LatLng
) => {
  const positionsByDistance = positions
    .map((currentPosition, index) => ({
      distance: point.distanceTo(currentPosition),
      position: currentPosition,
      index,
    }))
    .sort((lhs, rhs) => lhs.distance - rhs.distance)

  return positionsByDistance[0] ?? undefined

  // Interpolate here
}
