import {
  dateFromEpochSeconds,
  formattedHoursMinutes,
  formattedTime,
  formattedTimeDiff,
  formattedTimeDiffUnderThreshold,
  now,
  formattedScheduledTime,
  serviceDaySeconds,
} from "../../src/util/dateTime"

describe("now", () => {
  test("returns a Date for the current date-time", () => {
    expect(now() instanceof Date).toBeTruthy()
  })
})

describe("serviceDaySeconds", () => {
  test("returns number for a time before midnight", () => {
    expect(serviceDaySeconds(new Date("February 10, 2021 08:12"))).toEqual(
      29_520
    )
  })

  test("returns number for a time after midnight", () => {
    expect(serviceDaySeconds(new Date("February 11, 2021 01:05"))).toEqual(
      90_300
    )
  })

  test("correctly handles transition to DST", () => {
    expect(serviceDaySeconds(new Date("March 8, 2020 08:12"))).toEqual(29_520)
  })

  test("correctly handles transition from DST", () => {
    expect(serviceDaySeconds(new Date("November 1, 2020 08:12"))).toEqual(
      29_520
    )
  })
})

describe("dateFromEpochSeconds", () => {
  test("returns a Date object given an epoch time in seconds", () => {
    const epochSeconds = 1_534_340_301
    const expected = new Date("2018-08-15T13:38:21.000Z")

    expect(dateFromEpochSeconds(epochSeconds)).toEqual(expected)
  })
})

describe("formattedTime", () => {
  test("returns a formatted string version of the time", () => {
    expect(formattedTime(new Date("Februrary 18, 2020 0:38"))).toEqual(
      "12:38 AM"
    )
    expect(formattedTime(new Date("Februrary 18, 2020 9:38"))).toEqual(
      "9:38 AM"
    )
    expect(formattedTime(new Date("Februrary 18, 2020 12:38"))).toEqual(
      "12:38 PM"
    )
    expect(formattedTime(new Date("Februrary 18, 2020 21:08"))).toEqual(
      "9:08 PM"
    )
  })
})

describe("formattedTimeDiff", () => {
  test("returns a formatted string representing the difference in hours and minutes between two times", () => {
    const a: Date = new Date("Februrary 18, 2020 14:42")
    const b: Date = new Date("Februrary 18, 2020 9:38")

    const expected = "5 hr 4 min"

    expect(formattedTimeDiff(a, b)).toEqual(expected)
  })

  test("leaves off the hours bit if less than 1 hour", () => {
    const a: Date = new Date("Februrary 18, 2020 2:00")
    const b: Date = new Date("Februrary 18, 2020 1:01")

    const expected = "59 min"

    expect(formattedTimeDiff(a, b)).toEqual(expected)
  })
})

describe("formattedTimeDiffUnderThreshold", () => {
  test("returns formattedTime (absolute) if diff is greater than the threshold", () => {
    const a: Date = new Date("Februrary 18, 2020 14:42")
    const b: Date = new Date("Februrary 18, 2020 9:38")

    const expected = "9:38 AM"

    expect(formattedTimeDiffUnderThreshold(a, b, 60)).toEqual(expected)
  })

  test("returns a diff if diff is less than the threshold", () => {
    const a: Date = new Date("Februrary 18, 2020 2:00")
    const b: Date = new Date("Februrary 18, 2020 1:01")

    const expected = "59 min"

    expect(formattedTimeDiffUnderThreshold(a, b, 60)).toEqual(expected)
  })

  test("returns a diff if diff is equal to the threshold", () => {
    const a: Date = new Date("Februrary 18, 2020 2:01")
    const b: Date = new Date("Februrary 18, 2020 1:01")

    const expected = "1 hr 0 min"

    expect(formattedTimeDiffUnderThreshold(a, b, 60)).toEqual(expected)
  })
})

describe("formattedScheduledTime", () => {
  test("formats time", () => {
    expect(formattedScheduledTime(0)).toEqual("12:00 AM")
    expect(formattedScheduledTime(34100)).toEqual("9:28 AM")
    expect(formattedScheduledTime(43200)).toEqual("12:00 PM")
    expect(formattedScheduledTime(47100)).toEqual("1:05 PM")
    expect(formattedScheduledTime(86400)).toEqual("12:00 AM")
    expect(formattedScheduledTime(90900)).toEqual("1:15 AM")
  })
  test("applies offset seconds", () => {
    expect(formattedScheduledTime(34100, 120)).toEqual("9:30 AM")
    expect(formattedScheduledTime(34100, -180)).toEqual("9:25 AM")
    expect(formattedScheduledTime(34100, 0)).toEqual("9:28 AM")
    expect(formattedScheduledTime(46800, 3660)).toEqual("2:01 PM")
    expect(formattedScheduledTime(86399, 120)).toEqual("12:01 AM")
    expect(formattedScheduledTime(1, -180)).toEqual("11:57 PM")
  })
})

describe("formattedHoursMinutes", () => {
  test("works at midnight 00:00", () => {
    expect(formattedHoursMinutes(0, 0)).toEqual("12:00 AM")
  })

  test("works in am", () => {
    expect(formattedHoursMinutes(10, 55)).toEqual("10:55 AM")
  })

  test("works at noon", () => {
    expect(formattedHoursMinutes(12, 0)).toEqual("12:00 PM")
  })

  test("works in pm", () => {
    expect(formattedHoursMinutes(22, 55)).toEqual("10:55 PM")
  })

  test("works at midnight 24:00", () => {
    expect(formattedHoursMinutes(24, 0)).toEqual("12:00 AM")
  })

  test("works after midnight", () => {
    expect(formattedHoursMinutes(25, 55)).toEqual("1:55 AM")
  })

  test("zero pads short minutes, but not hours", () => {
    expect(formattedHoursMinutes(5, 5)).toEqual("5:05 AM")
  })
})
