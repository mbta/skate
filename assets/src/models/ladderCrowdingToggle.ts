import { ByRouteId, RouteId } from "../schedule"

export type LadderCrowdingToggle = boolean
export type LadderCrowdingToggles = ByRouteId<LadderCrowdingToggle>

export const emptyLadderCrowdingTogglesByRouteId: LadderCrowdingToggles = {}

export const getLadderCrowdingToggleForRoute = (
  crowdingToggles: LadderCrowdingToggles,
  routeId: RouteId
): LadderCrowdingToggle => crowdingToggles[routeId] || false

export const toggleLadderCrowdingForRoute = (
  crowdingToggles: LadderCrowdingToggles,
  routeId: RouteId
): LadderCrowdingToggles => ({
  ...crowdingToggles,
  [routeId]: !crowdingToggles[routeId],
})
