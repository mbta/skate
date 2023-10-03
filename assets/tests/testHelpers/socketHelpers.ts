import { jest } from "@jest/globals"
import { Socket, PushStatus, Channel } from "phoenix"

export const makeMockSocket = (): Socket & { channel: jest.Mock } =>
  ({
    channel: jest.fn(),
  } as Socket & { channel: jest.Mock })

export const makeMockChannel = (
  expectedReceiveMessage?: PushStatus | (() => PushStatus),
  expectedReceiveData?: (() => any) | any
) => {
  const result = {
    join: jest.fn(),
    leave: jest.fn(),
    on: jest.fn<Channel["on"]>(),
    receive:
      jest.fn<(message: PushStatus, handler: (data?: any) => void) => void>(),
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
            handler(
              typeof expectedReceiveData === "function"
                ? expectedReceiveData()
                : expectedReceiveData
            )
          }
          return result

        case "error":
          if (expectedReceiveData !== undefined) {
            handler(
              typeof expectedReceiveData === "function"
                ? expectedReceiveData()
                : expectedReceiveData
            )
          } else {
            handler({ reason: "ERROR_REASON" })
          }
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
