import React, { useState } from "react"
import { Form } from "react-bootstrap"

import { DateTimePicker } from "../dateTimePicker"
import { toIsoDateString, fromIsoDateString } from "../../util/dateTime"

const possibleDurations = [
  "1 hour",
  "2 hours",
  "3 hours",
  "4 hours",
  "5 hours",
  "6 hours",
  "7 hours",
  "8 hours",
  "Until end of service",
  "Until further notice",
]

const initialDate = (duration?: string) => {
  if (!duration) return null
  if (possibleDurations.includes(duration)) return null
  return fromIsoDateString(duration)
}

export const DurationSelect = ({
  onSelectDuration,
  selectedDuration,
}: {
  onSelectDuration: (duration: string | undefined) => void
  selectedDuration?: string
}) => {
  const init = initialDate(selectedDuration)
  const [dates, setDates] = useState<Date[]>(init ? [init] : []) // the array used by flatpickr
  const [dateSelected, setDateSelected] = useState<boolean>(!!init) // whether the custom date radio is checked

  return (
    <Form>
      {possibleDurations.map((duration) => (
        <Form.Check
          className="mb-2"
          onChange={() => {
            setDateSelected(false)
            setDates([])
            onSelectDuration(duration)
          }}
          id={`duration-${duration}`}
          key={`duration-${duration}`}
          type="radio"
          label={duration}
          checked={selectedDuration === duration}
        />
      ))}
      <Form.Check
        onChange={() => {
          setDateSelected(true)
          onSelectDuration(undefined)
          setDates([])
        }}
        id={"duration-date"}
        key={"duration-date"}
        type="radio"
        label="Date"
        checked={dateSelected === true}
      />
      <div className="mx-4 w-75">
        <DateTimePicker
          value={dates}
          className="w-75"
          aria-labelledby="duration-date"
          aria-required={dateSelected ? "true" : "false"}
          options={{
            minDate: "today",
            onChange: (v) => {
              setDates(v)
              onSelectDuration(v.length > 0 ? toIsoDateString(v[0]) : undefined)
            },
            onOpen: () => {
              setDateSelected(true)
              if (dates.length === 0) {
                onSelectDuration(undefined)
              }
            },
          }}
        />
      </div>
    </Form>
  )
}
