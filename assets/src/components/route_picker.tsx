import React from "react"
import { Route } from "../skate.d"

interface Props {
  routes: null | Route[]
}

const RoutePicker = ({ routes }: Props) => (
  <div className="m-route-picker">
    <h2>Routes</h2>

    {routes === null ?
      "loading..."
      :
      routes.map(route => (
        <div key={route.id} className="m-route-picker__route">
          {route.id}
        </div>
      ))
    }
  </div>
)

export default RoutePicker
