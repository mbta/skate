import { describe, test, expect } from "@jest/globals"
import {
  tagManagerEvent,
  tagManagerIdentify,
} from "../../src/helpers/googleTagManager"

describe("tagManagerEvent", () => {
  test("pushes event info if dataLayer is present", () => {
    const originalDataLayer = window.dataLayer
    window.dataLayer = []

    tagManagerEvent("test_event")

    expect(window.dataLayer.length).toBe(1)
    expect(window.dataLayer[0].event).toBe("test_event")

    window.dataLayer = originalDataLayer
  })

  test("does nothing if dataLayer is missing", () => {
    const originalDataLayer = window.dataLayer
    window.dataLayer = undefined

    tagManagerEvent("test_event")

    expect(window.dataLayer).toBeUndefined()

    window.dataLayer = originalDataLayer
  })
})

describe("tagManagerIdentify", () => {
  test("pushes user info if dataLayer is present", () => {
    const originalDataLayer = window.dataLayer
    window.dataLayer = []

    tagManagerIdentify("username")

    expect(window.dataLayer.length).toBe(1)
    expect(window.dataLayer[0].user_id).toBe("username")

    window.dataLayer = originalDataLayer
  })

  test("does nothing if dataLayer is missing", () => {
    const originalDataLayer = window.dataLayer
    window.dataLayer = undefined

    tagManagerIdentify("username")

    expect(window.dataLayer).toBeUndefined()

    window.dataLayer = originalDataLayer
  })

  test("does nothing if username is missing", () => {
    const originalDataLayer = window.dataLayer
    window.dataLayer = undefined

    tagManagerIdentify(null)

    expect(window.dataLayer).toBeUndefined()

    window.dataLayer = originalDataLayer
  })
})
