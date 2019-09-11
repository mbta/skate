import React, { ReactElement, useContext } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import AboutPage from "./aboutPage"
import LadderPage from "./ladderPage"
import SettingsPage from "./settingsPage"
import ShuttleMapPage from "./shuttleMapPage"
import TabBar from "./tabBar"

const App = (): ReactElement<HTMLDivElement> => {
  const [{ pickerContainerIsVisible }] = useContext(StateDispatchContext)

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
      </div>
    </BrowserRouter>
  )
}

export default App
