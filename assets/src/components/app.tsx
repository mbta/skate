import React, { ReactElement, useContext } from "react"
import { BrowserRouter, Route as BrowserRoute } from "react-router-dom"
import StateDispatchContext from "../contexts/stateDispatchContext"
import AboutPage from "./aboutPage"
import LadderPageContext from "./ladderPageContext"
import TabBar from "./tabBar"

const App = (): ReactElement<HTMLDivElement> => {
  const [{ routePickerIsVisible }] = useContext(StateDispatchContext)

  return (
    <BrowserRouter>
      <div className="m-app">
        <TabBar routePickerIsVisible={routePickerIsVisible} />
        <BrowserRoute exact={true} path="/" component={LadderPageContext} />
        <BrowserRoute path="/about" component={AboutPage} />
      </div>
    </BrowserRouter>
  )
}

export default App
