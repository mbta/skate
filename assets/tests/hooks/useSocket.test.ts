import { act, renderHook } from "@testing-library/react-hooks"
import useSocket, {
  ConnectionStatus,
  readUserToken,
} from "../../src/hooks/useSocket"

// tslint:disable: react-hooks-nesting

jest.mock("phoenix", () => ({
  Socket: jest.fn(() => ({
    connect: jest.fn(),
    onOpen: jest.fn(),
    onClose: jest.fn(),
  })),
  __esModule: true,
}))

describe("useSocket", () => {
  test("initially returns a loading socket", () => {
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket
    expect(mockSocket).toBeDefined()
    expect(mockSocket!.connect).toHaveBeenCalled()
    expect(result.current.connectionStatus).toEqual(ConnectionStatus.Loading)
  })

  test("connectionStatus is set to Connected when the socket connects", () => {
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket
    const [[onOpenHandler]] = (mockSocket!.onOpen as jest.Mock).mock.calls
    act(() => {
      onOpenHandler()
    })
    expect(result.current.connectionStatus).toEqual(ConnectionStatus.Connected)
  })

  test("connectionStatus is set to Disconnected when the socket closes", () => {
    const { result } = renderHook(() => useSocket())
    const mockSocket = result.current.socket
    const [[onCloseHandler]] = (mockSocket!.onClose as jest.Mock).mock.calls
    act(() => {
      onCloseHandler()
    })
    expect(result.current.connectionStatus).toEqual(
      ConnectionStatus.Disconnected
    )
  })
})

test("reads the user token from the page", () => {
  const mockElement = {
    dataset: {
      userToken: "mock-token",
    },
  }
  // @ts-ignore
  document.getElementById = () => mockElement

  expect(readUserToken()).toEqual("mock-token")
})
