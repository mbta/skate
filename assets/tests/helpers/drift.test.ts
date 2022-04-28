import { openDrift } from "../../src/helpers/drift"

window.drift = {
  api: {
    sidebar: {
      toggle: jest.fn(),
    },
  },
}

describe("openDrift", () => {
  test("calls Drift API function", () => {
    openDrift()

    expect(window.drift.api.sidebar.toggle).toHaveBeenCalled()
  })
})
