import React, { useEffect, useState } from "react"
import { fetchShapeForRoute } from "../api"
import { Shape } from "../schedule"
import { DiversionPage } from "./detours/diversionPage"

export const DummyDetourPage = () => {
  const [routeShape, setRouteShape] = useState<Shape | null>(null)

  useEffect(() => {
    fetchShapeForRoute("39").then((shapes) => {
      setRouteShape(shapes[0])
    })
  }, [])

  return (
    <div className="l-page">
      {routeShape && (
        <DiversionPage
          shape={routeShape}
          routeName="39"
          routeDescription="Forest Hills"
          routeOrigin="from Back Bay"
          routeDirection="Outbound"
        />
      )}
    </div>
  )
}
