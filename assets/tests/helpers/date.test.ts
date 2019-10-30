import { todayIsHalloween } from "../../src/helpers/date"

describe("todayIsHalloween", () => {
  test("returns true on Halloween", () => {
    const halloweenDate = new Date("October 31, 2019 12:00:00")

    expect(todayIsHalloween(halloweenDate)).toBeTruthy()
  })

  test("returns false on other days", () => {
    const nonHalloweenDate = new Date("October 30, 2019 12:00:00")

    expect(todayIsHalloween(nonHalloweenDate)).toBeFalsy()
  })
})
