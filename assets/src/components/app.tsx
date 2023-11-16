import React, { ReactElement, useContext, useEffect } from "react"
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
import { allOpenRouteIds } from "../models/routeTab"
import Nav from "./nav"
import RightPanel from "./rightPanel"
import { mapModeForUser } from "../util/mapMode"
import { Ghost, Vehicle, VehicleInScheduledService } from "../realtime"
import MapPage from "./mapPage"
import SearchPage from "./searchPage"
import { OpenView, isPagePath } from "../state/pagePanelState"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"
import PropertiesPanel from "./propertiesPanel"
import { isGhost, isVehicle } from "../models/vehicle"
import { TabMode } from "./propertiesPanel/tabPanels"

export const AppRoutes = () => {
  useAppcues()
  const location = useLocation()

  const [{ routeTabs }] = useContext(StateDispatchContext)

  const {
    setPath,
    setTabMode,
    closeView,
    currentView: { openView, selectedVehicleOrGhost, vppTabMode },
  } = usePanelStateFromStateDispatchContext()

  // Keep panel in sync with current path
  const { pathname: path } = location
  useEffect(() => {
    isPagePath(path) && setPath(path)
  }, [path, setPath])

  const vehiclesByRouteIdNeeded =
    openView === OpenView.Late || location.pathname === "/"

  const { socket } = useContext(SocketContext)
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
                  <RouteElement
                    selectedVehicleOrGhost={selectedVehicleOrGhost}
                    openView={openView}
                    openMapEnabled={true}
                    vppTabMode={vppTabMode}
                    setTabMode={setTabMode}
                    closeView={closeView}
                  />
                }
              >
                <BrowserRoute path="/" element={<LadderPage />} />
                <BrowserRoute
                  path="/shuttle-map"
                  element={<ShuttleMapPage />}
                />
                <BrowserRoute path="/settings" element={<SettingsPage />} />
              </Route>
              <Route
                element={
                  <RouteElement
                    selectedVehicleOrGhost={selectedVehicleOrGhost}
                    openView={openView}
                    openMapEnabled={false}
                    vppTabMode={vppTabMode}
                    setTabMode={setTabMode}
                    closeView={closeView}
                  />
                }
              >
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

const RouteElement = ({
  openMapEnabled,
  selectedVehicleOrGhost,
  openView,
  vppTabMode,
  setTabMode,
  closeView,
}: {
  openMapEnabled: boolean
  selectedVehicleOrGhost?: Vehicle | Ghost | null
  openView: OpenView
  vppTabMode?: TabMode
  setTabMode: (mode: TabMode) => void
  closeView: () => void
}) => (
  <>
    <Outlet />
    <RightPanel
      openView={openView}
      propertiesPanel={
        selectedVehicleOrGhost &&
        (isVehicle(selectedVehicleOrGhost) ||
          isGhost(selectedVehicleOrGhost)) ? (
          <PropertiesPanel
            selectedVehicleOrGhost={selectedVehicleOrGhost}
            tabMode={vppTabMode ?? "status"}
            onChangeTabMode={setTabMode}
            onClosePanel={closeView}
            openMapEnabled={openMapEnabled}
          />
        ) : undefined
      }
    />
  </>
)

const App = (): ReactElement<HTMLDivElement> => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
