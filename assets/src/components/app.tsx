import React, { ReactElement, useContext } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useAppcues from "../hooks/useAppcues"
import DataStatusBanner from "./dataStatusBanner"
import LadderPage from "./ladderPage"
import Modal from "./modal"
import SearchPage from "./searchPage"
import SettingsPage from "./settingsPage"
import ShuttleMapPage from "./shuttleMapPage"
import TabBar from "./tabBar"
import LateView from "./lateView"
import { OpenView } from "../state"

const AppRoutes = () => {
  useAppcues()

  const [{ pickerContainerIsVisible, openView }] =
    useContext(StateDispatchContext)

  return (
    <div className="m-app">
      <div className="m-app__banner">
        <DataStatusBanner />
      </div>
      <div className="m-app__main">
        <TabBar
          pickerContainerIsVisible={pickerContainerIsVisible}
          openView={openView}
        />
        <BrowserRoute exact={true} path="/" component={LadderPage} />
        <BrowserRoute
          exact={true}
          path="/shuttle-map"
          component={ShuttleMapPage}
        />
        <BrowserRoute exact={true} path="/settings" component={SettingsPage} />
        <BrowserRoute exact={true} path="/search" component={SearchPage} />
        {openView === OpenView.Late ? <LateView /> : null}
        <Modal />
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
