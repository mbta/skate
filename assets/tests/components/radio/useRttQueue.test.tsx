import { describe, test, expect } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useRttQueue } from "../../../src/components/radio/rtts/useRttQueue"
import { rttCallFactory } from "../../factories/radio/rtt"

describe("useRttQueue", () => {
  test("returns semantically nested namespaces (calls, tabs, actions, raw)", () => {
    const call1 = rttCallFactory.build({ id: "call-1", status: "unassigned" })
    const call2 = rttCallFactory.build({ id: "call-2", status: "done" })

    const { result } = renderHook(() =>
      useRttQueue({
        initialState: {
          incomingCalls: [call1],
          pastCalls: [call2],
          selectedCallId: "call-1",
          tab: "incoming",
        },
      })
    )

    // calls namespace
    expect(result.current.calls.incoming).toHaveLength(1)
    expect(result.current.calls.past).toHaveLength(1)
    expect(result.current.calls.activeList).toHaveLength(1)
    expect(result.current.calls.selectedId).toBe("call-1")
    expect(result.current.calls.selected?.id).toBe("call-1")
    expect(result.current.calls.activeId).toBeNull()
    expect(result.current.calls.active).toBeNull()
    expect(result.current.calls.isSelectedLive).toBe(false)

    // tabs namespace
    expect(result.current.tabs.current).toBe("incoming")
    expect(result.current.tabs.newIncomingCount).toBe(0)

    // actions namespace
    expect(typeof result.current.actions.selectCall).toBe("function")
    expect(typeof result.current.actions.respondCall).toBe("function")
    expect(typeof result.current.actions.markDoneCall).toBe("function")
    expect(typeof result.current.actions.receiveCall).toBe("function")
    expect(typeof result.current.actions.changeTab).toBe("function")
    expect(typeof result.current.actions.reset).toBe("function")

    // raw namespace
    expect(result.current.raw.state).toBeDefined()
    expect(typeof result.current.raw.dispatch).toBe("function")
  })

  test("maintains referential stability of actions across re-renders when callback deps are unchanged, and updates when deps change", () => {
    const call1 = rttCallFactory.build({ id: "call-1" })

    const { result, rerender } = renderHook(
      (props) =>
        useRttQueue({
          initialState: {
            incomingCalls: [call1],
          },
          currentDispatcherName: props.dispatcher,
        }),
      {
        initialProps: { dispatcher: "Dispatcher A" },
      }
    )

    const initialActions = result.current.actions

    // Re-render with same dependency
    rerender({ dispatcher: "Dispatcher A" })
    expect(result.current.actions).toBe(initialActions)

    // Re-render with updated dispatcher name -> actions should update to avoid stale closure
    rerender({ dispatcher: "Dispatcher B" })
    expect(result.current.actions).not.toBe(initialActions)
  })

  test("actions trigger expected state transitions in nested namespaces including receiveCall and reset", () => {
    const call1 = rttCallFactory.build({ id: "call-1", status: "unassigned" })
    const call2 = rttCallFactory.build({ id: "call-2", status: "unassigned" })
    const call3 = rttCallFactory.build({ id: "call-3", status: "unassigned" })

    const { result } = renderHook(() =>
      useRttQueue({
        initialState: {
          incomingCalls: [call1, call2],
          pastCalls: [],
        },
      })
    )

    // Receive a third call dynamically
    act(() => {
      result.current.actions.receiveCall(call3)
    })
    expect(result.current.calls.incoming).toHaveLength(3)
    expect(result.current.calls.incoming[0].id).toBe("call-3")

    // Respond to call-1
    act(() => {
      result.current.actions.respondCall(call1)
    })

    expect(result.current.calls.activeId).toBe("call-1")
    expect(result.current.calls.selectedId).toBe("call-1")
    expect(result.current.calls.isSelectedLive).toBe(true)
    expect(result.current.calls.active?.status).toBe("active")

    // Change tab to past
    act(() => {
      result.current.actions.changeTab("past")
    })
    expect(result.current.tabs.current).toBe("past")

    // Mark call-1 as done
    act(() => {
      result.current.actions.markDoneCall(call1)
    })
    expect(result.current.calls.activeId).toBeNull()
    expect(result.current.calls.incoming).toHaveLength(2)
    expect(result.current.calls.past).toHaveLength(1)

    // Reset queue
    act(() => {
      result.current.actions.reset({
        incomingCalls: [call2],
        pastCalls: [],
        tab: "incoming",
        selectedCallId: null,
      })
    })
    expect(result.current.calls.incoming).toHaveLength(1)
    expect(result.current.calls.past).toHaveLength(0)
    expect(result.current.tabs.current).toBe("incoming")
    expect(result.current.calls.selectedId).toBeNull()
  })

  test("controlled props override internal state reactively", () => {
    const call1 = rttCallFactory.build({ id: "call-1" })
    const call2 = rttCallFactory.build({ id: "call-2" })

    const { result, rerender } = renderHook(
      (props: { incoming: (typeof call1)[]; tab: "incoming" | "past" }) =>
        useRttQueue({
          incomingCalls: props.incoming,
          currentTab: props.tab,
        }),
      {
        initialProps: {
          incoming: [call1],
          tab: "incoming",
        },
      }
    )

    expect(result.current.calls.incoming).toEqual([call1])
    expect(result.current.tabs.current).toBe("incoming")

    // Consumer passes new props from external feed (e.g. Phoenix channel)
    rerender({
      incoming: [call1, call2],
      tab: "past",
    })

    expect(result.current.calls.incoming).toEqual([call1, call2])
    expect(result.current.tabs.current).toBe("past")
  })
})
