import React, { useContext } from "react"
import RouteLadders from "./routeLadders"
import { currentRouteTab } from "../models/routeTab"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  deselectRouteInTab,
  flipLadderInTab,
  toggleLadderCrowdingInTab,
} from "../state"

export const MinimalLadderPage = () => {
  const [{ routeTabs }, dispatch] = useContext(StateDispatchContext)

  const { selectedRouteIds, ladderDirections, ladderCrowdingToggles } =
    currentRouteTab(routeTabs) || {
      selectedRouteIds: [] as string[],
      ladderDirections: {},
      ladderCrowdingToggles: {},
    }

  return (
    <div className="c-ladder-page__tab-bar-and-ladders">
      <RouteLadders
        selectedRouteIds={selectedRouteIds}
        selectedVehicleId={undefined}
        deselectRoute={(routeId) => dispatch(deselectRouteInTab(routeId))}
        reverseLadder={(routeId) => dispatch(flipLadderInTab(routeId))}
        toggleCrowding={(routeId) =>
          dispatch(toggleLadderCrowdingInTab(routeId))
        }
        ladderDirections={ladderDirections}
        ladderCrowdingToggles={ladderCrowdingToggles}
      />
    </div>
  )
}
