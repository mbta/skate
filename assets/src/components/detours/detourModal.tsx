import React from "react"
import { DiversionPage } from "./diversionPage"
import { joinClasses } from "../../helpers/dom"
import { OriginalRoute } from "../../detour"

export const DetourModal = ({
  originalRoute,
  onClose,
  show,
}: {
  originalRoute: OriginalRoute
  onClose: () => void
  show: boolean
}) => {
  return (
    <div
      className={joinClasses([
        "c-detour-modal",
        !show && "c-detour-modal__hidden",
      ])}
    >
      <DiversionPage onClose={onClose} originalRoute={originalRoute} />
    </div>
  )
}
