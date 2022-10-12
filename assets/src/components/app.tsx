import React, { ReactElement, useContext } from "react"
import { Socket } from "phoenix"
import {
  BrowserRouter,
  Routes,
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
import Nav from "./nav"
import RightPanel from "./rightPanel"

const AppRoutes = () => {
  useAppcues()

  const [
    { pickerContainerIsVisible, openView, routeTabs, selectedVehicleOrGhost },
  ] = useContext(StateDispatchContext)

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
            <Routes>
              <BrowserRoute path="/" element={<LadderPage />} />
              <BrowserRoute path="/shuttle-map" element={<ShuttleMapPage />} />
              <BrowserRoute path="/settings" element={<SettingsPage />} />
              <BrowserRoute path="/search" element={<SearchPage />} />
            </Routes>
            {openView === OpenView.Late ? <LateView /> : null}
            <RightPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
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
