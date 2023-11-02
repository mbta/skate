import React, { ReactElement, useContext } from "react"
import { Socket } from "phoenix"
import {
  BrowserRouter,
  Routes,
  Route as BrowserRoute,
  useLocation,
  Route,
  Outlet,
} from "react-router-dom"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { VehiclesByRouteIdProvider } from "../contexts/vehiclesByRouteIdContext"
import { SocketContext } from "../contexts/socketContext"
import { ByRouteId } from "../schedule.d"
import useAppcues from "../hooks/useAppcues"
import useVehicles from "../hooks/useVehicles"
import DataStatusBanner from "./dataStatusBanner"
import LadderPage from "./ladderPage"
import Modal from "./modal"
import SettingsPage from "./settingsPage"
import ShuttleMapPage from "./shuttleMapPage"
import LateView from "./lateView"
import { OpenView } from "../state"
import { allOpenRouteIds } from "../models/routeTab"
import Nav from "./nav"
import RightPanel from "./rightPanel"
import { mapModeForUser } from "../util/mapMode"
import { Ghost, VehicleInScheduledService } from "../realtime"
import MapPage from "./mapPage"
import SearchPage from "./searchPage"

export const AppRoutes = () => {
  useAppcues()

  const [{ openView, routeTabs, selectedVehicleOrGhost }] =
    useContext(StateDispatchContext)

  const { socket }: { socket: Socket | undefined } = useContext(SocketContext)

  const location = useLocation()

  const vehiclesByRouteIdNeeded =
    openView === OpenView.Late || location.pathname === "/"

  const vehiclesByRouteId: ByRouteId<(VehicleInScheduledService | Ghost)[]> =
    useVehicles(
      socket,
      vehiclesByRouteIdNeeded ? allOpenRouteIds(routeTabs) : []
    )

  const mapMode = mapModeForUser()

  const mapElement = mapMode.path === "/map" ? <MapPage /> : <SearchPage />

  return (
    <div className="l-app">
      <div className="l-app__banner">
        <DataStatusBanner />
      </div>
      <VehiclesByRouteIdProvider vehiclesByRouteId={vehiclesByRouteId}>
        <div className="l-app__main">
          <Nav allowViews>
            <Routes>
              <Route
                element={
                  <>
                    <Outlet />
                    <RightPanel
                      selectedVehicleOrGhost={selectedVehicleOrGhost}
                    />
                    {openView === OpenView.Late ? <LateView /> : null}
                  </>
                }
              >
                <BrowserRoute path="/" element={<LadderPage />} />
                <BrowserRoute
                  path="/shuttle-map"
                  element={<ShuttleMapPage />}
                />
                <BrowserRoute path="/settings" element={<SettingsPage />} />
                <BrowserRoute path={mapMode.path} element={mapElement} />
              </Route>
            </Routes>
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
