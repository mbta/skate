import { LadderCrowdingToggles } from "./models/ladderCrowdingToggle"
import { LadderDirections } from "./models/ladderDirection"
import { RouteId } from "./schedule.d"

export interface RouteSettings {
  selectedRouteIds: RouteId[]
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
}

export const defaultRouteSettings: RouteSettings = {
  selectedRouteIds: [],
  ladderDirections: {},
  ladderCrowdingToggles: {},
}
