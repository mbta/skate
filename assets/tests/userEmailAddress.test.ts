import { jest, describe, test, expect } from "@jest/globals"
import appData from "../src/appData"
import getEmailAddress from "../src/userEmailAddress"

jest.mock("appData")

describe("getEmailAddress", () => {
  test("returns the email address from app data", () => {
    jest.mocked(appData).mockReturnValue({
      emailAddress: "test@mbta.com",
    })

    expect(getEmailAddress()).toEqual("test@mbta.com")
  })
})
