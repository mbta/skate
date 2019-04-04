import * as React from "react"
import { Route } from "../skate.d"
import RoutePicker from "./route_picker"

const routes: Route[] = [{ id: "1" }, { id: "66" }]

const App = (): JSX.Element => (
  <>
    <h1>Skate</h1>

    <RoutePicker routes={routes} />
  </>
)

export default App
