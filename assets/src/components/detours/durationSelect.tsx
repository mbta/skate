import React, { useState } from "react"
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
  console.log(dates)
  return (
    <Form>
      {possibleDurations.map((duration) => (
        <Form.Check
          className="mb-2"
          onChange={() => onSelectDuration(duration)}
          id={`duration-${duration}`}
          key={`duration-${duration}`}
          type="radio"
          label={duration}
          checked={selectedDuration === duration}
        />
      ))}
      <Form.Check
        onChange={() => {}}
        id={"duration-date"}
        key={"duration-date"}
        type="radio"
        label="Date"
      />
      <DateTimePicker
        value={dates}
        options={{
          minDate: "today",
          onChange: setDates,
        }}
      />
    </Form>
  )
}
