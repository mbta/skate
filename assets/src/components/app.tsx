import React, { ReactElement } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import {
  Route,
  RouteId,
  TimepointsByRouteId,
  VehicleId,
  VehiclesByRouteId,
} from "../skate"
import AboutPage from "./aboutPage"
import LadderPage from "./ladderPage"
import TabBar from "./tabBar"

interface Props {
  routePickerIsVisible: boolean
  routes: Route[] | null
  timepointsByRouteId: TimepointsByRouteId
  selectedRouteIds: RouteId[]
  vehiclesByRouteId: VehiclesByRouteId
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
