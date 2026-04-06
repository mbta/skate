import React, { useEffect, useState } from "react"
import { Form } from "react-bootstrap"

import { DateTimePicker } from "../dateTimePicker"

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

export const DurationSelect = ({
  onSelectDuration,
  selectedDuration,
}: {
  onSelectDuration: (duration: string) => void
  selectedDuration?: string
}) => {
  // pass the duration as a date string in a parseable format (look at what activation date is stored as)
  const [dates, setDates] = useState<Date[]>([])
  const [dateSelected, setDateSelected] = useState<Boolean>(false)

  return (
    <Form>
      {possibleDurations.map((duration) => (
        <Form.Check
          className="mb-2"
          onChange={() => {
            setDateSelected(false)
            onSelectDuration(duration)
            setDates([])
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
          onSelectDuration("")
        }}
        id={"duration-date"}
        key={"duration-date"}
        type="radio"
        label="Date"
        checked={dateSelected === true}
      />
      <DateTimePicker
        value={dates}
        options={{
          minDate: "today",
          onChange: setDates,
          onOpen: () => {
            setDateSelected(true)
            onSelectDuration("")
          },
        }}
      />
    </Form>
  )
}
