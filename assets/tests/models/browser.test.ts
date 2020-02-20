import { reload } from "../../src/models/browser"

describe("reload", () => {
  let reloadSpy: jest.SpyInstance

  beforeEach(() => {
    // Dirty: setting window.location as writable so we can spy on reload function.
    // Doing this once here to avoid it in all other tests.
    Object.defineProperty(window, "location", {
      writable: true,
      value: { reload: jest.fn() },
    })

    reloadSpy = jest.spyOn(window.location, "reload")
    reloadSpy.mockImplementation(() => ({}))
  })

  afterEach(() => {
    reloadSpy.mockRestore()
  })

  test("calls window.location.reload", () => {
    reload()

    expect(reloadSpy).toHaveBeenCalled()
  })

  test("passes on an optional forceGet argument", () => {
    reload(true)

    expect(reloadSpy).toHaveBeenCalledWith(true)
  })
})
