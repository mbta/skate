import React, { useRef, useEffect } from "react"
import flatpickr from "flatpickr"
import { Options } from "flatpickr/dist/types/options"

import "flatpickr/dist/flatpickr.css"
import { Calendar } from "../helpers/bsIcons"
import { CircleXIcon } from "./circleXIcon"

interface Props {
  value: Date[]
  options: Options
  className?: String
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
        dateFormat: "D, M j, Y",
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
  }, [])

  useEffect(() => {
    if (fpRef.current) {
      fpRef.current.setDate(value)
    }
  }, [value])

  return (
    <div className={`c-date-time-picker ${className || ""}`} ref={inputRef}>
      <input
        className="form-control"
        type="text"
        data-input
        placeholder="Select date"
        {...props}
      />
      <div className="c-date-time-picker__input-controls">
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
