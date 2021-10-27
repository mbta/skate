import { RouteId } from "../schedule.d"
import { LadderDirections } from "./ladderDirection"
import { LadderCrowdingToggles } from "./ladderCrowdingToggle"

export interface RouteTab {
  selectedRouteIds: RouteId[]
  ladderDirections: LadderDirections
  ladderCrowdingToggles: LadderCrowdingToggles
}
