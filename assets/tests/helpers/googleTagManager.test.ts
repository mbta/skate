import { tagManagerEvent } from "../../src/helpers/googleTagManager"

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
