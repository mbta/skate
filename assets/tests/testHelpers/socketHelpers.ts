import { Socket } from "phoenix"

export const makeMockSocket = (): Socket & { channel: jest.Mock } =>
  ({
    channel: jest.fn(),
  } as Socket & { channel: jest.Mock })

export const makeMockChannel = (
  expectedReceiveMessage?:
    | "ok"
    | "error"
    | "timeout"
    | (() => "ok" | "error" | "timeout"),
  expectedReceiveData?: (() => any) | any
) => {
  const result = {
    join: jest.fn(),
    leave: jest.fn(),
    on: jest.fn(),
    receive: jest.fn(),
    push: jest.fn(),
  }
  result.join.mockImplementation(() => result)
  result.push.mockImplementation(() => result)
  result.receive.mockImplementation((message, handler) => {
    const receiveMessage =
      typeof expectedReceiveMessage === "function"
        ? expectedReceiveMessage()
        : expectedReceiveMessage

    if (message === receiveMessage) {
      switch (message) {
        case "ok":
          if (expectedReceiveData !== undefined) {
            if (typeof expectedReceiveData === "function") {
              const expectedReceived = expectedReceiveData()
              handler(expectedReceived)
            } else {
              handler(expectedReceiveData)
            }
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
  const result: { join: any; on: any; receive: any; leave: any } = {
    join: () => result,
    on: jest.fn(),
    receive: (event: any, handler: ({ data }: { data: any }) => void) => {
      if (event === "ok") {
        handler({ data: dataOnJoin })
      }
      return result
    },
    leave: jest.fn(),
  }

  return result
}
