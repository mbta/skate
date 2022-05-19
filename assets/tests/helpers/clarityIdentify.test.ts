import clarityIdentify from "../../src/helpers/clarityIdentify"

describe("clarityIdentify", () => {
  test("calls window.clarity with appropriate arguments", () => {
    const clarity = jest.fn()

    clarityIdentify(clarity, "username")

    expect(clarity).toHaveBeenCalledWith("identify", "username")
  })

  test("doesn't attempt to call clarity function when not present", () => {
    const clarity = undefined

    try {
      clarityIdentify(clarity, "username")
    } catch {
      fail()
    }
  })

  test("does nothing when username not present", () => {
    const clarity = jest.fn()

    clarityIdentify(clarity, undefined)

    expect(clarity).not.toHaveBeenCalled()
  })
})
