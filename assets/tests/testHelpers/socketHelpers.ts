import { Socket } from "phoenix"

export const makeMockSocket = (): Socket & { channel: jest.Mock } =>
  ({
    channel: jest.fn(),
  } as Socket & { channel: jest.Mock })

export const makeMockChannel = (
  expectedJoinMessage?: "ok" | "error" | "timeout",
  expectedJoinData?: any
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
          if (expectedJoinData !== undefined) {
            handler(expectedJoinData)
          }
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

export const makeMockOneShotChannel = (dataOnJoin?: any) => {
  const result: { join: any; on: any; leave: any } = {
    join: jest.fn(),
    on: (_: any, handler: ({ data }: { data: any }) => void) => {
      result.join = () => handler({ data: dataOnJoin })
    },
    leave: jest.fn(),
  }

  return result
}
