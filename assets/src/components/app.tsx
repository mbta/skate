import React, { ReactElement } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import {
  Route,
  RouteId,
  TimepointsByRouteId,
  VehicleId,
  VehiclesByRouteId,
} from "../skate"
import FAQPage from "./faqPage"
import RoutePage from "./ladderPage"
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
      <BrowserRoute exact={true} path="/" render={() => RoutePage(props)} />
      <BrowserRoute path="/about" component={FAQPage} />
    </div>
  </BrowserRouter>
)

export default App
