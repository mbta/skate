import { describe, test, expect } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useRttQueue } from "../../../../src/components/radio/rtts/useRttQueue"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("useRttQueue", () => {
  test("maintains referential stability of actions across re-renders when callback deps are unchanged, and updates when deps change", () => {
    const call = rttCallFactory.build({ id: "call-1" })

    const { result, rerender } = renderHook(
      (props) =>
        useRttQueue({
          initialState: {
            incomingCalls: [call],
          },
          currentDispatcherName: props.dispatcher,
        }),
      {
        initialProps: { dispatcher: "Dispatcher A" },
      }
    )

    const initialActions = result.current.actions

    // Re-render with same dependency -> action references preserved
    rerender({ dispatcher: "Dispatcher A" })
    expect(result.current.actions).toBe(initialActions)

    // Re-render with updated dispatcher name -> actions refresh to avoid stale closures
    rerender({ dispatcher: "Dispatcher B" })
    expect(result.current.actions).not.toBe(initialActions)
  })

  test("actions trigger expected state transitions in nested namespaces including receiveCall and reset", () => {
    const firstCall = rttCallFactory.build({
      id: "call-1",
      status: "unassigned",
    })
    const secondCall = rttCallFactory.build({
      id: "call-2",
      status: "unassigned",
    })
    const incomingCall = rttCallFactory.build({
      id: "call-3",
      status: "unassigned",
    })

    const { result } = renderHook(() =>
      useRttQueue({
        initialState: {
          incomingCalls: [firstCall, secondCall],
          pastCalls: [],
          selectedCallId: firstCall.id,
          tab: "incoming",
        },
      })
    )

    // Verify initial state projection
    expect(result.current.calls.selectedId).toBe(firstCall.id)
    expect(result.current.calls.selected?.id).toBe(firstCall.id)
    expect(result.current.calls.isSelectedLive).toBe(false)

    // Receive a third call dynamically
    act(() => {
      result.current.actions.receiveCall(incomingCall)
    })
    expect(result.current.calls.incoming.map((c) => c.id)).toEqual([
      incomingCall.id,
      firstCall.id,
      secondCall.id,
    ])

    // Respond to firstCall
    act(() => {
      result.current.actions.respondCall(firstCall)
    })
    expect(result.current.calls.activeId).toBe(firstCall.id)
    expect(result.current.calls.selectedId).toBe(firstCall.id)
    expect(result.current.calls.isSelectedLive).toBe(true)
    expect(result.current.calls.active?.status).toBe("active")

    // Change tab to past
    act(() => {
      result.current.actions.changeTab("past")
    })
    expect(result.current.tabs.current).toBe("past")

    // Mark firstCall as done
    act(() => {
      result.current.actions.markDoneCall(firstCall)
    })
    expect(result.current.calls.activeId).toBeNull()
    expect(result.current.calls.incoming.map((c) => c.id)).toEqual([
      incomingCall.id,
      secondCall.id,
    ])
    expect(result.current.calls.past.map((c) => c.id)).toEqual([firstCall.id])

    // Reset queue
    act(() => {
      result.current.actions.reset({
        incomingCalls: [secondCall],
        pastCalls: [],
        tab: "incoming",
        selectedCallId: null,
      })
    })
    expect(result.current.calls.incoming.map((c) => c.id)).toEqual([
      secondCall.id,
    ])
    expect(result.current.calls.past).toEqual([])
    expect(result.current.tabs.current).toBe("incoming")
    expect(result.current.calls.selectedId).toBeNull()
  })

  test("controlled props override internal state reactively", () => {
    const firstCall = rttCallFactory.build({ id: "call-1" })
    const secondCall = rttCallFactory.build({ id: "call-2" })

    const { result, rerender } = renderHook(
      (props: { incoming: (typeof firstCall)[]; tab: "incoming" | "past" }) =>
        useRttQueue({
          incomingCalls: props.incoming,
          currentTab: props.tab,
        }),
      {
        initialProps: {
          incoming: [firstCall],
          tab: "incoming",
        },
      }
    )

    expect(result.current.calls.incoming).toEqual([firstCall])
    expect(result.current.tabs.current).toBe("incoming")

    // Consumer passes new props from external feed (e.g. Phoenix channel)
    rerender({
      incoming: [firstCall, secondCall],
      tab: "past",
    })

    expect(result.current.calls.incoming).toEqual([firstCall, secondCall])
    expect(result.current.tabs.current).toBe("past")
  })
})
