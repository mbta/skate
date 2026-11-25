import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import DisconnectedModal from "../../src/components/disconnectedModal"
import { SocketProvider } from "../../src/contexts/socketContext"
import { NORMAL_SOCKET_CLOSE_CODE } from "../../src/helpers/socketLifecycle"
import { ConnectionStatus } from "../../src/hooks/useSocket"
import * as browser from "../../src/models/browser"
import { makeMockSocket } from "../testHelpers/socketHelpers"

describe("DisconnectedModal", () => {
  let reloadSpy: jest.Spied<typeof browser.reload>

  beforeEach(() => {
    reloadSpy = jest.spyOn(browser, "reload").mockImplementation(() => {})
  })

  afterEach(() => {
    reloadSpy.mockRestore()
  })

  test("renders", () => {
    const { baseElement } = render(<DisconnectedModal />)
    expect(baseElement).toMatchSnapshot()
  })

  test("refreshes when you click the button", async () => {
    const result = render(<DisconnectedModal />)
    await userEvent.click(result.getByRole("button"))
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })

  test("disconnects socket with code 1000 before reloading when Refresh is clicked", async () => {
    const mockSocket = makeMockSocket()
    let completeDisconnect: (() => void) | undefined
    mockSocket.disconnect.mockImplementation((callback) => {
      completeDisconnect = callback
    })

    const result = render(
      <SocketProvider
        socketStatus={{
          socket: mockSocket,
          connectionStatus: ConnectionStatus.Disconnected,
        }}
      >
        <DisconnectedModal />
      </SocketProvider>
    )

    await userEvent.click(result.getByRole("button"))

    expect(mockSocket.disconnect).toHaveBeenCalledWith(
      expect.any(Function),
      NORMAL_SOCKET_CLOSE_CODE
    )
    expect(reloadSpy).not.toHaveBeenCalled()

    completeDisconnect?.()
    expect(reloadSpy).toHaveBeenCalledTimes(1)
  })
})
