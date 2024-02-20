import React, { useEffect, useRef } from "react"
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
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    console.log("ATTEMPT FOCUS")
    if (ref.current) {
      console.log("ACTUALLY REEALLY ATTEMTP FOCUS")
      ref.current?.focus()
      console.log("ref.current", ref.current)
    } else {
      console.log("WAIT NEVERMIND")
    }
  }, [ref.current])

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
      ref={ref}
      className={joinClasses([
        "c-detour-modal",
        !show && "c-detour-modal__hidden",
      ])}
    >
      <DiversionPage onClose={onClose} originalRoute={originalRoute} />
    </div>
  )
}
