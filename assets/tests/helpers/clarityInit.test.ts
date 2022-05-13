import clarityInit from "../../src/helpers/clarityInit"

describe("clarityInit", () => {
  test("calls window.clarity with appropriate arguments", () => {
    const clarity = jest.fn()

    clarityInit(clarity, "username")

    expect(clarity).toHaveBeenCalledWith("identify", "username")
  })

  test("doesn't attempt to call clarity function when not present", () => {
    const clarity = undefined

    try {
      clarityInit(clarity, "username")
    } catch {
      fail()
    }
  })

  test("does nothing when username not present", () => {
    const clarity = jest.fn()

    clarityInit(clarity, undefined)

    expect(clarity).not.toHaveBeenCalled()
  })
})
