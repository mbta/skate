import React, { useRef, useEffect } from "react"
import flatpickr from "flatpickr"
import { Options } from "flatpickr/dist/types/options"

import "flatpickr/dist/flatpickr.css"
import { Calendar } from "../helpers/bsIcons"
import { CircleXIcon } from "./circleXIcon"

interface Props {
  value: Date[]
  options: Options
  className?: string
}

export const DateTimePicker = ({
  value,
  options,
  className,
  ...props
}: Props) => {
  const inputRef = useRef<HTMLDivElement | null>(null)
  const fpRef = useRef<flatpickr.Instance | null>(null)

  useEffect(() => {
    if (inputRef.current) {
      fpRef.current = flatpickr(inputRef.current, {
        altInput: true,
        altFormat: "D, M j, Y",
        wrap: true,
        mode: "multiple",
        ...options,
      })
    }

    return () => {
      if (fpRef.current) {
        fpRef.current.destroy()
        fpRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // as a react wrapper for flatpickr, we don't want to list out all their possible configuration options here

  useEffect(() => {
    if (fpRef.current) {
      fpRef.current.setDate(value)
    }
  }, [value])

  return (
    <div className={`input-group-filter ${className || ""}`} ref={inputRef}>
      <input type="text" data-input placeholder="Select date" {...props} />
      <div className="">
        {fpRef.current && fpRef.current.selectedDates.length > 0 && (
          <button onClick={() => fpRef.current && fpRef.current.clear()}>
            <span>
              <CircleXIcon />
            </span>
          </button>
        )}
        <button data-toggle>
          <span>
            <Calendar />
          </span>
        </button>
      </div>
    </div>
  )
}
