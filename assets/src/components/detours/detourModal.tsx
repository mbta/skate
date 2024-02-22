import React, { useEffect } from "react"
import { DiversionPage } from "./diversionPage"
import { joinClasses } from "../../helpers/dom"
import { OriginalRoute } from "../../models/detour"

export const DetourModal = ({
  originalRoute,
  onClose,
  show,
}: {
  originalRoute: OriginalRoute
  onClose: () => void
  show: boolean
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

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
