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
  } else if (routeName === "Red Line") {
    return "m-route-pill--red"
  } else if (routeName === "Orange Line") {
    return "m-route-pill--orange"
  } else if (routeName === "Blue Line") {
    return "m-route-pill--blue"
  } else if (["B", "C", "D", "E"].includes(routeName)) {
    return "m-route-pill--green"
  } else if (routeName === "Mattapan Trolley") {
    return "m-route-pill--red"
  }

  return "m-route-pill--bus"
}

const routeNameTransform = (routeName: string): string => {
  switch (routeName) {
    case "Red Line":
      return "RL"
    case "Orange Line":
      return "OL"
    case "Blue Line":
      return "BL"
    case "B":
      return "GL·B"
    case "C":
      return "GL·C"
    case "D":
      return "GL·D"
    case "E":
      return "GL·E"
    case "Mattapan Trolley":
      return "M"
    default:
      return routeName
  }
}
