import { describe, test, expect } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useRttSelection } from "../../../src/components/radio/rtts/useRttSelection"
import { useRttQueueTabs } from "../../../src/components/radio/rtts/useRttQueueTabs"
import { useRttQueue } from "../../../src/components/radio/rtts/useRttQueue"
import { rttCallFactory } from "../../factories/radio/rtt"

describe("useRttSelection", () => {
  test("resolves selectedCall from incomingCalls or pastCalls without creating combined arrays", () => {
    const call1 = rttCallFactory.build({ id: "call-1" })
    const call2 = rttCallFactory.build({ id: "call-2" })

    const { result, rerender } = renderHook(
      (props) =>
        useRttSelection({
          selectedCallId: props.selectedCallId,
          activeCallId: props.activeCallId,
          incomingCalls: [call1],
          pastCalls: [call2],
        }),
      {
        initialProps: {
          selectedCallId: "call-1",
          activeCallId: null as string | null,
        },
      }
    )

    expect(result.current.selectedCall?.id).toBe("call-1")
    expect(result.current.isSelectedLive).toBe(false)

    // Select call from pastCalls
    rerender({ selectedCallId: "call-2", activeCallId: null })
    expect(result.current.selectedCall?.id).toBe("call-2")
  })

  test("determines isSelectedLive when selectedCall is activeCall or status is active", () => {
    const call1 = rttCallFactory.build({ id: "call-live", status: "active" })

    const { result } = renderHook(() =>
      useRttSelection({
        selectedCallId: "call-live",
        activeCallId: "call-live",
        incomingCalls: [call1],
        pastCalls: [],
      })
    )

    expect(result.current.isSelectedLive).toBe(true)
    expect(result.current.activeCall?.id).toBe("call-live")
  })

  test("handleSelectCall dispatches action and invokes onSelectCall", () => {
    const call1 = rttCallFactory.build({ id: "call-select" })
    let dispatchedId: string | null = null
    let callbackCalledWith: typeof call1 | null = null

    const { result } = renderHook(() =>
      useRttSelection({
        selectedCallId: null,
        activeCallId: null,
        incomingCalls: [call1],
        pastCalls: [],
        dispatchSelectCall: (id) => {
          dispatchedId = id
        },
        onSelectCall: (c) => {
          callbackCalledWith = c
        },
      })
    )

    act(() => {
      result.current.handleSelectCall(call1)
    })

    expect(dispatchedId).toBe("call-select")
    expect(callbackCalledWith).toEqual(call1)
  })
})

describe("useRttQueueTabs", () => {
  test("handleTabClick dispatches action and invokes onTabChange", () => {
    let dispatchedTab: string | null = null
    let callbackTab: string | null = null

    const { result } = renderHook(() =>
      useRttQueueTabs({
        tab: "incoming",
        newIncomingCount: 3,
        dispatchTabChange: (t) => {
          dispatchedTab = t
        },
        onTabChange: (t) => {
          callbackTab = t
        },
      })
    )

    expect(result.current.tab).toBe("incoming")
    expect(result.current.newIncomingCount).toBe(3)

    act(() => {
      result.current.handleTabClick("past")
    })

    expect(dispatchedTab).toBe("past")
    expect(callbackTab).toBe("past")
  })
})

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

  test("maintains referential stability of actions across re-renders", () => {
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

    // Re-render without changing callback dependencies
    rerender({ dispatcher: "Dispatcher A" })
    expect(result.current.actions).toBe(initialActions)
  })

  test("actions trigger expected state transitions in nested namespaces", () => {
    const call1 = rttCallFactory.build({ id: "call-1", status: "unassigned" })
    const call2 = rttCallFactory.build({ id: "call-2", status: "unassigned" })

    const { result } = renderHook(() =>
      useRttQueue({
        initialState: {
          incomingCalls: [call1, call2],
          pastCalls: [],
        },
      })
    )

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
    expect(result.current.calls.incoming).toHaveLength(1)
    expect(result.current.calls.past).toHaveLength(1)
  })
})
