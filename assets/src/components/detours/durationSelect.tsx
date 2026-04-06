import React, { useEffect, useState } from "react"
import { Form } from "react-bootstrap"

import { DateTimePicker } from "../dateTimePicker"
import { toIsoDateString } from "../../util/dateTime"

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
  onSelectDuration: (duration: string | undefined) => void
  selectedDuration?: string
}) => {
  const [date, setDate] = useState<Date | null>(null)
  const [dateSelected, setDateSelected] = useState<Boolean>(false)

  useEffect(() => {
    if (date && dateSelected) {
      onSelectDuration(toIsoDateString(date))
    } else if (dateSelected) {
      onSelectDuration(undefined)
    }
  }, [date, dateSelected])

  return (
    <Form>
      {possibleDurations.map((duration) => (
        <Form.Check
          className="mb-2"
          onChange={() => {
            setDateSelected(false)
            onSelectDuration(duration)
            setDate(null)
          }}
          id={`duration-${duration}`}
          key={`duration-${duration}`}
          type="radio"
          label={duration}
          checked={selectedDuration === duration}
        />
      ))}
      <Form.Check
        onChange={() => setDateSelected(true)}
        id={"duration-date"}
        key={"duration-date"}
        type="radio"
        label="Date"
        checked={dateSelected === true}
      />
      <div className="mx-4 w-75">
        <DateTimePicker
          value={date ? [date] : []}
          className="w-75"
          aria-labelledby="duration-date"
          aria-required={dateSelected ? "true" : "false"}
          options={{
            minDate: "today",
            onChange: (dates) =>
              dates.length > 0 ? setDate(dates[0]) : setDate(null),
            onOpen: () => setDateSelected(true),
          }}
        />
      </div>
    </Form>
  )
}
