import React, { useContext } from "react"
import RouteLadders from "./routeLadders"
import { routeTabById } from "../models/routeTab"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  deselectRouteInTab,
  flipLadderInTab,
  toggleLadderCrowdingInTab,
} from "../state"
import { useParams } from "react-router-dom"

export const MinimalLadder = () => {
  const [{ routeTabs }, dispatch] = useContext(StateDispatchContext)
  const id = useParams().id as string

  const routeTab = routeTabById(routeTabs, id)
  if (!routeTab) window.location.href = "/minimal"

  const { selectedRouteIds, ladderDirections, ladderCrowdingToggles } =
    routeTab || {
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
