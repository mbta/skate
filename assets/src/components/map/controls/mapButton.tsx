import React, { ComponentPropsWithoutRef } from "react"
import { Button } from "react-bootstrap"
import { joinClasses } from "../../../helpers/dom"

interface MapButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  size: "s" | "m" | "l"
}

export const MapButton = (props: MapButtonProps) => {
  const buttonProps = { ...props, size: undefined }

  return (
    <Button
      {...buttonProps}
      variant="outline-primary"
      className={joinClasses([
        "border-box",
        "inherit-box",
        "border-0",
        "d-flex",
        "justify-content-center",
        "align-items-center",
        "c-map-button",
        "c-map-button--" + props.size,
      ])}
    >
      {props.size}
    </Button>
  )
}
