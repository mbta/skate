import React, { ReactElement } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import { VehicleId, VehiclesForRoute } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import AboutPage from "./aboutPage"
import LadderPage from "./ladderPage"
import TabBar from "./tabBar"

interface Props {
  routePickerIsVisible: boolean
  routes: Route[] | null
  timepointsByRouteId: TimepointsByRouteId
  selectedRouteIds: RouteId[]
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>
  selectedVehicleId: VehicleId | undefined
}

const App = (props: Props): ReactElement<HTMLDivElement> => (
  <BrowserRouter>
    <div className="m-app">
      <TabBar routePickerIsVisible={props.routePickerIsVisible} />
      <BrowserRoute exact={true} path="/" render={() => LadderPage(props)} />
      <BrowserRoute path="/about" component={AboutPage} />
    </div>
  </BrowserRouter>
)

export default App
