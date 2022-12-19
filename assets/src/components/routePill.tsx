import React from "react"
import { className } from "../helpers/dom"

export const RoutePill = ({
  routeName,
}: {
  routeName: string
}): JSX.Element => {
  const classes = className(["m-route-pill", modeClass(routeName)])

  return <div className={classes}>{routeNameTransform(routeName)}</div>
}

const modeClass = (routeName: string): string => {
  if (routeName.match(/^SL*/)) {
    return "m-route-pill--silver"
  } else if (routeName === "Red") {
    return "m-route-pill--red"
  } else if (routeName === "Orange") {
    return "m-route-pill--orange"
  } else if (routeName === "Blue") {
    return "m-route-pill--blue"
  } else if (["B", "C", "D", "E"].includes(routeName)) {
    return "m-route-pill--green"
  }

  return "m-route-pill--bus"
}

const routeNameTransform = (routeName: string): string => {
  switch (routeName) {
    case "Red":
      return "RL"
    case "Orange":
      return "OL"
    case "Blue":
      return "BL"
    case "B":
      return "GL·B"
    case "C":
      return "GL·C"
    case "D":
      return "GL·D"
    case "E":
      return "GL·E"
    default:
      return routeName
  }
}
