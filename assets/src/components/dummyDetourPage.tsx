import React, { useEffect, useState } from "react"
import { fetchShapeForRoute } from "../api"
import { DetourMap } from "./detours/detourMap"
import { Shape } from "../schedule"

export const DummyDetourPage = () => {
  const [routeShape, setRouteShape] = useState<Shape | null>(null)

  useEffect(() => {
    fetchShapeForRoute("39").then((shapes) => {
      setRouteShape(shapes[0])
    })
  }, [])

  return (
    <div className="l-page">
      {routeShape && <DetourMap shape={routeShape} />}
    </div>
  )
}
