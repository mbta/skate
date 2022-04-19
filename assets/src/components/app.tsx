import React, { ReactElement, useContext } from "react"
import { Socket } from "phoenix"
import {
  BrowserRouter,
  Route as BrowserRoute,
  useLocation,
} from "react-router-dom"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehiclesByRouteIdProvider } from "../contexts/vehiclesByRouteIdContext"
import { SocketContext } from "../contexts/socketContext"
import { ByRouteId } from "../schedule.d"
import { VehicleOrGhost } from "../realtime.d"
import useAppcues from "../hooks/useAppcues"
import useVehicles from "../hooks/useVehicles"
import DataStatusBanner from "./dataStatusBanner"
import LadderPage from "./ladderPage"
import Modal from "./modal"
import SearchPage from "./searchPage"
import SettingsPage from "./settingsPage"
import ShuttleMapPage from "./shuttleMapPage"
import LateView from "./lateView"
import { OpenView } from "../state"
import { allOpenRouteIds } from "../models/routeTab"
import { Nav } from "./nav"

const AppRoutes = () => {
  useAppcues()

  const [{ pickerContainerIsVisible, openView, routeTabs }] =
    useContext(StateDispatchContext)

  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)

  const location = useLocation()

  const vehiclesByRouteIdNeeded =
    openView === OpenView.Late || location.pathname === "/"

  const vehiclesByRouteId: ByRouteId<VehicleOrGhost[]> = useVehicles(
    socket,
    vehiclesByRouteIdNeeded ? allOpenRouteIds(routeTabs) : []
  )

  return (
    <div className="m-app">
      <div className="m-app__banner">
        <DataStatusBanner />
      </div>
      <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
        <div className="m-app__main">
          <Nav
            pickerContainerIsVisible={pickerContainerIsVisible}
            openView={openView}
          >
            <BrowserRoute exact={true} path="/" component={LadderPage} />
            <BrowserRoute
              exact={true}
              path="/shuttle-map"
              component={ShuttleMapPage}
            />
            <BrowserRoute
              exact={true}
              path="/settings"
              component={SettingsPage}
            />
            <BrowserRoute exact={true} path="/search" component={SearchPage} />
            {openView === OpenView.Late ? <LateView /> : null}
          </Nav>
          <Modal />
        </div>
      </VehiclesByRouteIdProvider>
    </div>
  )
}

const App = (): ReactElement<HTMLDivElement> => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
