import React, { ReactElement } from "react"
import { BrowserRouter, NavLink, Route as BrowserRoute } from "react-router-dom"
import {
  Route,
  RouteId,
  TimepointsByRouteId,
  VehicleId,
  VehiclesByRouteId,
} from "../skate"
import FAQPage from "./faqPage"
import RoutePage from "./routePage"

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
      <TabBar {...props} />
      <BrowserRoute exact={true} path="/" render={() => RoutePage(props)} />
      <BrowserRoute path="/faq" component={FAQPage} />
    </div>
  </BrowserRouter>
)

const TabBar = ({
  routePickerIsVisible,
}: Props): ReactElement<HTMLDivElement> => (
  <div className={`m-tab-bar ${routePickerIsVisible ? "visible" : "hidden"}`}>
    <div className="m-tab-bar__logo">
      <svg
        width="24"
        height="24"
        viewBox="0 0 55.49 30.12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="m-tab-bar__icon"
          d="m16.35 19.85a5.28 5.28 0 0 1 1.32 3.46 5.73 5.73 0 0 1 -1 3.17 6.92 6.92 0 0 1 -2.81 2.41 10.13 10.13 0 0 1 -4.56.92 10.37 10.37 0 0 1 -4.3-.81 7.76 7.76 0 0 1 -2.8-2.08 10.1 10.1 0 0 1 -1.58-2.64l3.08-1.14a6.88 6.88 0 0 0 1.87 2.63 5.43 5.43 0 0 0 3.72 1.14 5.7 5.7 0 0 0 3.71-1.06 3.06 3.06 0 0 0 1.3-2.42c0-1.45-1-2.42-3.14-2.91l-3.7-.92a8.1 8.1 0 0 1 -4.37-2.43 5.57 5.57 0 0 1 -1.39-3.67 5.38 5.38 0 0 1 1.05-3.28 7 7 0 0 1 2.87-2.22 10 10 0 0 1 4.13-.81 8 8 0 0 1 4.91 1.4 7.88 7.88 0 0 1 2.73 3.79l-3 .85a13.84 13.84 0 0 0 -.66-1.23 4 4 0 0 0 -1.37-1.35 4.8 4.8 0 0 0 -2.61-.65 5.67 5.67 0 0 0 -3.35 1 2.74 2.74 0 0 0 -.4 4.36 5.88 5.88 0 0 0 2.8 1.39l3.25.8a7.93 7.93 0 0 1 4.3 2.3zm21.65-12.4h-4.17l-8.9 9.87h-.4v-17.17h-3.36v29.21h3.36v-7.66l2.58-2.78 7.89 10.44h3.94l-9.56-12.58zm16.67 15.67a6.09 6.09 0 0 1 -3.51 5.76 8.26 8.26 0 0 1 -3.63.78 8.39 8.39 0 0 1 -3.66-.78 6.08 6.08 0 0 1 -3.56-5.76 5.93 5.93 0 0 1 .9-3.3 6.05 6.05 0 0 1 2.43-2.16 5.21 5.21 0 0 1 -2.07-1.93 5.56 5.56 0 0 1 -.76-3 5.81 5.81 0 0 1 .87-3.26 5.46 5.46 0 0 1 2.39-2 9.14 9.14 0 0 1 6.87 0 5.35 5.35 0 0 1 2.37 2 5.8 5.8 0 0 1 .86 3.26 5.55 5.55 0 0 1 -.76 3 5.14 5.14 0 0 1 -2.08 1.92 6.15 6.15 0 0 1 2.44 2.16 6 6 0 0 1 .9 3.31zm-10.61-10.25a3.17 3.17 0 0 0 1 2.46 3.44 3.44 0 0 0 2.44 1 3.38 3.38 0 0 0 2.4-.94 3.23 3.23 0 0 0 1-2.44 3 3 0 0 0 -1-2.34 3.59 3.59 0 0 0 -2.45-.89 3.62 3.62 0 0 0 -2.38.84 2.88 2.88 0 0 0 -1.01 2.31zm7.27 10.13a3.92 3.92 0 0 0 -.52-2 4 4 0 0 0 -1.41-1.43 3.88 3.88 0 0 0 -3.88 0 3.93 3.93 0 0 0 -1.9 3.43 3.74 3.74 0 0 0 .52 2 3.79 3.79 0 0 0 1.41 1.4 3.89 3.89 0 0 0 2 .51 3.6 3.6 0 0 0 2.72-1.12 3.76 3.76 0 0 0 1.06-2.79z"
        />
      </svg>
    </div>
    <ul>
      <li>
        <NavLink
          activeClassName="m-tab-bar__link--active"
          className="m-tab-bar__link"
          exact={true}
          title="Routes"
          to="/"
        >
          <svg
            viewBox="0 0 48 48"
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="m-tab-bar__icon"
              d="m32.73 39.86v-12.08a4.37 4.37 0 0 1 0-7.56v-12.08a4.36 4.36 0 1 1 4.36 0v12.08a4.37 4.37 0 0 1 0 7.56v12.08a4.36 4.36 0 1 1 -4.36 0zm-17.46 0a4.36 4.36 0 1 1 -4.36 0v-12.08a4.37 4.37 0 0 1 0-7.56v-12.08a4.36 4.36 0 1 1 4.36 0v12.08a4.37 4.37 0 0 1 0 7.56z"
            />
          </svg>
        </NavLink>
      </li>
      <li>
        <NavLink
          activeClassName="m-tab-bar__link--active"
          className="m-tab-bar__link"
          title="FAQ"
          to="/faq"
        >
          <svg
            viewBox="0 0 48 48"
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="m-tab-bar__icon"
              d="m24 0a24 24 0 1 0 24 24 24 24 0 0 0 -24-24zm1.71 40.05a3.5 3.5 0 0 1 -4.82 0 3.15 3.15 0 0 1 -1-2.36 3.23 3.23 0 0 1 1-2.38 3.48 3.48 0 0 1 4.82 0 3.24 3.24 0 0 1 1 2.38 3.16 3.16 0 0 1 -1 2.36zm7-20.46a9.55 9.55 0 0 1 -2 2.59c-.79.73-1.57 1.47-2.36 2.22a10 10 0 0 0 -2 2.64 8.43 8.43 0 0 0 -.76 3.96h-4.59a14.32 14.32 0 0 1 .55-4.3 9.62 9.62 0 0 1 1.41-2.91 13.55 13.55 0 0 1 1.84-2c.66-.59 1.27-1.15 1.85-1.7a7.19 7.19 0 0 0 1.35-1.9 5 5 0 0 0 .55-2.45 4.58 4.58 0 0 0 -1.21-3.39 4.45 4.45 0 0 0 -3.27-1.2 4.91 4.91 0 0 0 -3.07 1.12 4.42 4.42 0 0 0 -1.46 3.73h-5.07a8.89 8.89 0 0 1 1.29-5 8.12 8.12 0 0 1 3.47-3 11.37 11.37 0 0 1 4.88-1 9.55 9.55 0 0 1 6.89 2.4 8.47 8.47 0 0 1 2.49 6.38 8 8 0 0 1 -.76 3.81z"
            />
          </svg>
        </NavLink>
      </li>
    </ul>
  </div>
)

export default App
