import { describe, test, expect, jest } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import {
  useScenarioChannel,
  DEFAULT_SCENARIOS_TOPIC,
} from "../../../../src/components/research/scenarios/useScenarioChannel"
import { Scenario } from "../../../../src/components/research/scenarios/types"
import {
  makeMockChannel,
  makeMockSocket,
} from "../../../testHelpers/socketHelpers"

describe("useScenarioChannel", () => {
  const sampleScenario: Scenario = {
    id: "s1",
    name: "Scenario 1",
    description: "First scenario description",
  }

  test("subscribes to default topic and handles initial connect", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: null })
    mockSocket.channel.mockReturnValue(mockChannel)

    const { result } = renderHook(() =>
      useScenarioChannel({ socket: mockSocket })
    )

    expect(mockSocket.channel).toHaveBeenCalledWith(DEFAULT_SCENARIOS_TOPIC)
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
    expect(result.current.isConnected).toBe(true)
    expect(result.current.activeScenario).toBeNull()
  })

  test("does not rejoin or leave channel when callback references change", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: null })
    mockSocket.channel.mockReturnValue(mockChannel)

    const callback1 = jest.fn()
    const callback2 = jest.fn()

    const { rerender } = renderHook(
      ({ onTrigger }) =>
        useScenarioChannel({
          socket: mockSocket,
          onScenarioTriggered: onTrigger,
        }),
      {
        initialProps: { onTrigger: callback1 },
      }
    )

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
    expect(mockChannel.leave).not.toHaveBeenCalled()

    // Re-render with new callback reference
    rerender({ onTrigger: callback2 })

    // Channel should NOT have been left or rejoined
    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
    expect(mockChannel.leave).not.toHaveBeenCalled()
  })

  test("uses the latest callback reference when channel receives an event", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: null })
    mockSocket.channel.mockReturnValue(mockChannel)

    const eventHandlers: Record<string, (data: any) => void> = {}
    mockChannel.on.mockImplementation((event: string, handler: any) => {
      eventHandlers[event] = handler
      return 1
    })

    const callback1 = jest.fn()
    const callback2 = jest.fn()

    const { rerender } = renderHook(
      ({ onTrigger }) =>
        useScenarioChannel({
          socket: mockSocket,
          onScenarioTriggered: onTrigger,
        }),
      {
        initialProps: { onTrigger: callback1 },
      }
    )

    // Update to callback2
    rerender({ onTrigger: callback2 })

    // Simulate scenario_triggered event
    act(() => {
      eventHandlers["scenario_triggered"]?.({ data: sampleScenario })
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledWith(sampleScenario)
  })

  test("leaves the channel on unmount", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: null })
    mockSocket.channel.mockReturnValue(mockChannel)

    const { unmount } = renderHook(() =>
      useScenarioChannel({ socket: mockSocket })
    )

    expect(mockChannel.leave).not.toHaveBeenCalled()
    unmount()
    expect(mockChannel.leave).toHaveBeenCalledTimes(1)
  })
})
