import { describe, test, expect, jest } from "@jest/globals"
import React from "react"
import { render, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import RadioQueuePage from "../../src/components/radio/radioQueuePage"
import { SocketProvider } from "../../src/contexts/socketContext"
import { ConnectionStatus } from "../../src/hooks/useSocket"
import userEvent from "@testing-library/user-event"
import { makeMockSocket } from "../testHelpers/socketHelpers"

const RESEARCH_TOPIC = "research:scenarios:rtt_queue"

const makeScenarioSocket = () => {
  const socket = makeMockSocket()
  const channels: Array<Record<string, Array<(payload?: any) => void>>> = []
  let activeScenario: any = null

  const broadcast = (event: string, payload: any) => {
    channels.forEach((handlers) => {
      handlers[event]?.forEach((handler) => handler(payload))
    })
  }

  socket.channel.mockImplementation(() => {
    const handlers: Record<string, Array<(payload?: any) => void>> = {}
    channels.push(handlers)

    const channel = {
      join: jest.fn(),
      leave: jest.fn(),
      on: jest.fn((event: string, handler: (payload?: any) => void) => {
        handlers[event] = [...(handlers[event] ?? []), handler]
        return channel
      }),
      receive: jest.fn((message: string, handler: (payload?: any) => void) => {
        if (message === "ok") {
          handler({ data: activeScenario })
        }
        return channel
      }),
      push: jest.fn((event: string, payload: any) => {
        const pushResult = {
          receive: jest.fn((message: string, handler: (value?: any) => void) => {
            if (message === "ok") {
              if (event === "trigger_scenario") {
                activeScenario = payload
                handler({})
                broadcast("scenario_triggered", { data: payload })
              } else if (event === "reset_scenario") {
                activeScenario = null
                handler({})
                broadcast("scenario_reset", { data: null })
              }
            }
            return pushResult
          }),
        }

        return pushResult
      }),
    }

    channel.join.mockImplementation(() => channel)

    return channel
  })

  return socket
}

const renderWithSocket = (socket?: ReturnType<typeof makeMockSocket>) =>
  render(
    <SocketProvider
      socketStatus={{
        socket,
        connectionStatus: ConnectionStatus.Connected,
      }}
    >
      <RadioQueuePage />
    </SocketProvider>
  )

describe("RadioQueuePage", () => {
  test("renders the radio queue page heading and scenario dropdown", () => {
    render(<RadioQueuePage />)

    expect(
      screen.getByRole("heading", { name: /Radio RTT Queue/ })
    ).toBeInTheDocument()

    expect(
      screen.getByRole("button", { name: "Skate testing scenarios" })
    ).toBeInTheDocument()
  })

  test("joins the dedicated RTT queue scenario topic", () => {
    const socket = makeScenarioSocket()

    renderWithSocket(socket)

    expect(socket.channel).toHaveBeenCalledWith(RESEARCH_TOPIC)
  })

  test("broadcasts scenario changes to all page viewers", async () => {
    const socket = makeScenarioSocket()
    const user = userEvent.setup()

    const firstViewer = renderWithSocket(socket)
    const secondViewer = renderWithSocket(socket)

    await user.click(
      within(firstViewer.container).getByRole("button", {
        name: "Skate testing scenarios",
      })
    )
    await user.click(
      within(firstViewer.container).getByText("Standard")
    )

    expect(
      within(firstViewer.container).getByRole("button", {
        name: "Select RTT call for vehicle 1901",
      })
    ).toBeInTheDocument()
    expect(
      within(secondViewer.container).getByRole("button", {
        name: "Select RTT call for vehicle 1901",
      })
    ).toBeInTheDocument()

    await user.click(
      within(secondViewer.container).getByRole("button", {
        name: "Skate testing scenarios",
      })
    )

    expect(
      within(secondViewer.container).getByText("Standard")
    ).toHaveClass("active")
  })
})
