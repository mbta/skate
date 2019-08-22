import React, { ReactElement, useContext } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import featureIsEnabled from "../laboratoryFeatures"
import AboutPage from "./aboutPage"
import LadderPage from "./ladderPage"
import SettingsPage from "./settingsPage"
import ShuttleMapPage from "./shuttleMapPage"
import TabBar from "./tabBar"

const App = (): ReactElement<HTMLDivElement> => {
  const [{ routePickerIsVisible }] = useContext(StateDispatchContext)

  return (
    <BrowserRouter>
      <div className="m-app">
        <TabBar routePickerIsVisible={routePickerIsVisible} />
        <BrowserRoute exact={true} path="/" component={LadderPage} />
        {featureIsEnabled("shuttle_map") && (
          <BrowserRoute
            exact={true}
            path="/shuttle-map"
            component={ShuttleMapPage}
          />
        )}
        <BrowserRoute exact={true} path="/settings" component={SettingsPage} />
        <BrowserRoute path="/about" component={AboutPage} />
      </div>
    </BrowserRouter>
  )
}

export default App
