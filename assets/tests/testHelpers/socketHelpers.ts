export const makeMockSocket = () => ({
  channel: jest.fn(),
})

export const makeMockChannel = (
  expectedJoinMessage: "ok" | "error" | "timeout"
) => {
  const result = {
    join: jest.fn(),
    leave: jest.fn(),
    on: jest.fn(),
    receive: jest.fn(),
  }
  result.join.mockImplementation(() => result)
  result.receive.mockImplementation((message, handler) => {
    if (message === expectedJoinMessage) {
      switch (message) {
        case "ok":
          return result

        case "error":
          handler({ reason: "ERROR_REASON" })
          break

        case "timeout":
          handler()
      }
    }

    return result
  })
  return result
}
