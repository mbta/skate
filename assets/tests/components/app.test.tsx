import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import App from "../../src/components/app"
import { SocketProvider } from "../../src/contexts/socketContext"
import useDataStatus from "../../src/hooks/useDataStatus"
import { ConnectionStatus } from "../../src/hooks/useSocket"

jest.mock("../../src/hooks/useDataStatus", () => ({
  __esModule: true,
  default: jest.fn(() => "good"),
}))
jest.mock("../../src/hooks/useRoutes", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

describe("App", () => {
  test("renders", () => {
    const tree = renderer.create(<App />).toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("shows disconnected modal if the socket is disconnected", () => {
    const wrapper = mount(
      <SocketProvider
        socketStatus={{
          socket: undefined,
          connectionStatus: ConnectionStatus.Disconnected,
        }}
      >
        <App />
      </SocketProvider>
    )
    expect(wrapper.exists(".m-disconnected-modal")).toBeTruthy()
  })

  test("shows data outage banner if there's a data outage", () => {
    ;(useDataStatus as jest.Mock).mockImplementationOnce(() => "outage")
    const tree = renderer.create(<App />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
