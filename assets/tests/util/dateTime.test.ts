import {
  ampm,
  dateFromEpochSeconds,
  formattedTime,
  formattedTimeDiff,
  hours12,
  now,
  formattedScheduledTime,
} from "../../src/util/dateTime"

describe("now", () => {
  test("returns a Date for the current date-time", () => {
    expect(now() instanceof Date).toBeTruthy()
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
      "12:38am"
    )
    expect(formattedTime(new Date("Februrary 18, 2020 9:38"))).toEqual("9:38am")
    expect(formattedTime(new Date("Februrary 18, 2020 12:38"))).toEqual(
      "12:38pm"
    )
    expect(formattedTime(new Date("Februrary 18, 2020 21:08"))).toEqual(
      "9:08pm"
    )
  })
})

describe("formattedTimeDiff", () => {
  test("returns a formatted string representing the difference in hours and minutes between two times", () => {
    const a: Date = new Date("Februrary 18, 2020 14:42")
    const b: Date = new Date("Februrary 18, 2020 9:38")

    const expected: string = "5h 4m"

    expect(formattedTimeDiff(a, b)).toEqual(expected)
  })

  test("leaves off the hours bit if less than 1 hour", () => {
    const a: Date = new Date("Februrary 18, 2020 2:00")
    const b: Date = new Date("Februrary 18, 2020 1:01")

    const expected: string = "59m"

    expect(formattedTimeDiff(a, b)).toEqual(expected)
  })
})

describe("formattedScheduledTime", () => {
  test("formats time", () => {
    expect(formattedScheduledTime(0)).toEqual("12:00am")
    expect(formattedScheduledTime(34100)).toEqual("9:28am")
    expect(formattedScheduledTime(43200)).toEqual("12:00pm")
    expect(formattedScheduledTime(47100)).toEqual("1:05pm")
    expect(formattedScheduledTime(86400)).toEqual("12:00am")
    expect(formattedScheduledTime(90900)).toEqual("1:15am")
  })
})

describe("hours12", () => {
  test("returns the 12-hour version of the 24-hour-plus hour", () => {
    expect(hours12(0)).toEqual(12)
    expect(hours12(5)).toEqual(5)
    expect(hours12(12)).toEqual(12)
    expect(hours12(13)).toEqual(1)
    expect(hours12(24)).toEqual(12)
    expect(hours12(25)).toEqual(1)
  })
})

describe("ampm", () => {
  test("returns whether a 24-hour-plus hours number represents 'am' or 'pm'", () => {
    expect(ampm(0)).toEqual("am")
    expect(ampm(9)).toEqual("am")
    expect(ampm(12)).toEqual("pm")
    expect(ampm(21)).toEqual("pm")
    expect(ampm(24)).toEqual("am")
    expect(ampm(25)).toEqual("am")
  })
})
