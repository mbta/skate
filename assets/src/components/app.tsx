import React, { ReactElement, useContext } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { ConnectionStatus } from "../hooks/useSocket"
import AboutPage from "./aboutPage"
import DisconnectedModal from "./disconnectedModal"
import LadderPage from "./ladderPage"
import SearchPage from "./searchPage"
import SettingsPage from "./settingsPage"
import ShuttleMapPage from "./shuttleMapPage"
import TabBar from "./tabBar"

const App = (): ReactElement<HTMLDivElement> => {
  const [{ pickerContainerIsVisible }] = useContext(StateDispatchContext)
  const { connectionStatus } = useContext(SocketContext)

  return (
    <BrowserRouter>
      <div className="m-app">
        <TabBar pickerContainerIsVisible={pickerContainerIsVisible} />
        <BrowserRoute exact={true} path="/" component={LadderPage} />
        <BrowserRoute
          exact={true}
          path="/shuttle-map"
          component={ShuttleMapPage}
        />
        <BrowserRoute exact={true} path="/settings" component={SettingsPage} />
        <BrowserRoute path="/about" component={AboutPage} />
        <BrowserRoute exact={true} path="/search" component={SearchPage} />
        {connectionStatus === ConnectionStatus.Disconnected ? (
          <DisconnectedModal />
        ) : null}
      </div>
    </BrowserRouter>
  )
}

export default App
