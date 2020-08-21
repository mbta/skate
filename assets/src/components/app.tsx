import React, { ReactElement, useContext } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useAppcues from "../hooks/useAppcues"
import { ConnectionStatus } from "../hooks/useSocket"
import DataStatusBanner from "./dataStatusBanner"
import DisconnectedModal from "./disconnectedModal"
import LadderPage from "./ladderPage"
import SearchPage from "./searchPage"
import SettingsPage from "./settingsPage"
import ShuttleMapPage from "./shuttleMapPage"
import TabBar from "./tabBar"
import { Notifications } from "./notifications"

const AppRoutes = () => {
  useAppcues()

  const [{ pickerContainerIsVisible }] = useContext(StateDispatchContext)
  const { connectionStatus } = useContext(SocketContext)

  return (
    <div className="m-app">
      <div className="m-app__banner">
        <DataStatusBanner />
      </div>
      <div className="m-app__main">
        <Notifications />
        <TabBar pickerContainerIsVisible={pickerContainerIsVisible} />
        <BrowserRoute exact={true} path="/" component={LadderPage} />
        <BrowserRoute
          exact={true}
          path="/shuttle-map"
          component={ShuttleMapPage}
        />
        <BrowserRoute exact={true} path="/settings" component={SettingsPage} />
        <BrowserRoute exact={true} path="/search" component={SearchPage} />
        {connectionStatus === ConnectionStatus.Disconnected ? (
          <DisconnectedModal />
        ) : null}
      </div>
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
