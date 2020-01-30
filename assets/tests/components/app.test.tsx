import React from "react"
import renderer from "react-test-renderer"
import App from "../../src/components/app"
import { SocketProvider } from "../../src/contexts/socketContext"
import { ConnectionStatus } from "../../src/hooks/useSocket"

jest.mock("../../src/laboratoryFeatures", () => ({
  __esModule: true,
  default: () => true,
}))

describe("App", () => {
  test("renders", () => {
    const tree = renderer.create(<App />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("shows disconnected modal if the socket is disconnected", () => {
    const tree = renderer
      .create(
        <SocketProvider
          socketStatus={{
            socket: undefined,
            connectionStatus: ConnectionStatus.Disconnected,
          }}
        >
          <App />
        </SocketProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
