import { ByRouteId } from "../schedule"

export type LadderCrowdingToggle = boolean
export type LadderCrowdingToggles = ByRouteId<LadderCrowdingToggle>

export const emptyLadderCrowdingTogglesByRouteId: LadderCrowdingToggles = {}
