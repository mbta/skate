import { RoutePatternId, ViaVariant } from "../schedule"

/**
 * A via variants is a one-character id for disambiguating variants within a given routeId and directionId
 *
 * They belong to the set [0-9A-Z_]
 *
 * Via variants are given by hastus, but not propogated through GTFS.
 * But we can reconstruct them from the routePatternId.
 * In the routePatternId "116-4-1":
 * "116" is the routeId.
 * "4" is the viaVariant.
 * "1" is the directionId.
 */
export const getViaVariant = (
  routePatternId: RoutePatternId | null | undefined
): ViaVariant | null => {
  const match =
    routePatternId && routePatternId.match(/-(?<viaVariant>.)-[01]$/)
  if (match && match.groups) {
    return match.groups.viaVariant
  } else {
    return null
  }
}
