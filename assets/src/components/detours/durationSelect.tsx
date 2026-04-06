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

const initialDate = (duration: any) => {
  if (!duration) return null
  if (possibleDurations.includes(duration)) return null
  return new Date(duration)
}

export const DurationSelect = ({
  onSelectDuration,
  selectedDuration,
}: {
  onSelectDuration: (duration: string | undefined) => void
  selectedDuration?: string
}) => {
  const init = initialDate(selectedDuration)
  const [dates, setDates] = useState<Date[]>(init ? [init] : [])
  const [dateSelected, setDateSelected] = useState<Boolean>(!!init)
  const date = dates.length > 0 ? dates[0] : null

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
        onChange={() => setDateSelected(true)}
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
            onChange: setDates,
            onOpen: () => setDateSelected(true),
          }}
        />
      </div>
    </Form>
  )
}
