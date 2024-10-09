import React, { ComponentPropsWithoutRef } from "react"
import { joinClasses } from "../helpers/dom"

export const RoutePill = ({
  children,
  routeName,
  largeFormat,
  className,
  ...props
}: {
  children?: React.ReactNode
  routeName: string
  largeFormat?: boolean
  className?: string
} & ComponentPropsWithoutRef<"div">): JSX.Element => {
  const classes = joinClasses([
    "c-route-pill",
    modeClass(routeName),
    largeFormat ? "c-route-pill--large-format" : "",
    className,
  ])

  return (
    <div {...props} className={classes}>
      {children}
      {routeNameTransform(routeName)}
    </div>
  )
}

const modeClass = (routeName: string): string => {
  if (routeName.match(/^SL*/)) {
    return "c-route-pill--silver"
  } else if (routeName === "Red Line") {
    return "c-route-pill--red"
  } else if (routeName === "Orange Line") {
    return "c-route-pill--orange"
  } else if (routeName === "Blue Line") {
    return "c-route-pill--blue"
  } else if (["B", "C", "D", "E"].includes(routeName)) {
    return "c-route-pill--green"
  } else if (routeName === "Mattapan Trolley") {
    return "c-route-pill--red"
  }

  return "c-route-pill--bus"
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
