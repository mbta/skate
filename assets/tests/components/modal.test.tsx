jest.mock("../../src/hooks/useMinischedule", () => ({
  __esModule: true,
  useMinischeduleRuns: jest.fn(),
}))

describe("Modal", () => {
  test.todo("renders inactive notification modal when appropriate")

  test.todo("renders loading modal when appropriate")
})
