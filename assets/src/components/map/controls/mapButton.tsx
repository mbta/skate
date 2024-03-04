import React, { ComponentPropsWithRef } from "react"
import { Button } from "react-bootstrap"
import { joinClasses } from "../../../helpers/dom"

export const MapButton = (props: ComponentPropsWithRef<typeof Button>) => {
  return (
    <Button
      {...props}
      variant="outline-primary"
      className={joinClasses([
        "border-box",
        "inherit-box",
        "border-0",
        "d-flex",
        "flex-column",
        "justify-content-center",
        "align-items-center",
        "c-map-button",
        props.size && "c-map-button--" + props.size,
      ])}
    >
      {props.children}
      {props.size === "lg" && props.title && (
        <span className="mt-1">{props.title}</span>
      )}
    </Button>
  )
}
