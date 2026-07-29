import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals"
//import { reload } from "../../src/models/browser"
import { replaceLocation, reset } from "jest-location-mock/hooks/jest"

describe("reload", () => {
  let reloadSpy: jest.Spied<() => void>

  beforeEach(() => {
    // Safely swaps out window.location with a mock wrapper
    replaceLocation()
    reloadSpy = jest.spyOn(window.location, "reload")
  })

  afterEach(() => {
    // Restore the original window.location object after each test
    reset()
  })

  test("calls window.location.reload", () => {
    window.location.reload()

    // Assert that the mock function was called
    expect(reloadSpy).toHaveBeenCalled()
  })
})
