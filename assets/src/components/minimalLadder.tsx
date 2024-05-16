import React, { useContext, useEffect } from "react"
import RouteLadders from "./routeLadders"
import { routeTabById } from "../models/routeTab"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  deselectRouteInTab,
  flipLadderInTab,
  toggleLadderCrowdingInTab,
} from "../state"
import { useNavigate, useParams } from "react-router-dom"

export const MinimalLadder = ({ id }: { id: string }) => {
  const [{ routeTabs }, dispatch] = useContext(StateDispatchContext)
  const navigate = useNavigate()

  const routeTab = routeTabById(routeTabs, id)

  useEffect(() => {
    if (!routeTab) {
      navigate("/minimal")
    }
  }, [routeTab])

  const {
    selectedRouteIds = [],
    ladderDirections = {},
    ladderCrowdingToggles = {},
  } = routeTab || {}

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

const MinimalLadderFromRouterParam = () => {
  const { id } = useParams()
  return <>{id && <MinimalLadder id={id} />}</>
}

MinimalLadder.FromRouterParam = MinimalLadderFromRouterParam
