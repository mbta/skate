import React, { useContext } from "react"
import StateDispatchContext from "../contexts/stateDispatchContext"
import useRoutes from "../hooks/useRoutes"
import useTimepoints from "../hooks/useTimepoints"
import { Route, TimepointsByRouteId } from "../skate"
import LadderPage from "./ladderPage"

const LadderPageContext = () => {
  const [state] = useContext(StateDispatchContext)
  const { routePickerIsVisible, selectedRouteIds, selectedVehicleId } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )

  return (
    <LadderPage
      routePickerIsVisible={routePickerIsVisible}
      routes={routes}
      timepointsByRouteId={timepointsByRouteId}
      selectedRouteIds={selectedRouteIds}
      selectedVehicleId={selectedVehicleId}
    />
  )
}

export default LadderPageContext
