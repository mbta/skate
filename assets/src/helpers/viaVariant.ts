import { RoutePatternId, ViaVariant } from "../schedule"

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
