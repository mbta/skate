import { describe, test, expect } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useRttSelection } from "../../../src/components/radio/rtts/useRttSelection"
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

  test("returns null selectedCall and false isSelectedLive when selectedCallId does not exist", () => {
    const call1 = rttCallFactory.build({ id: "call-1" })

    const { result } = renderHook(() =>
      useRttSelection({
        selectedCallId: "non-existent-id",
        activeCallId: null,
        incomingCalls: [call1],
        pastCalls: [],
      })
    )

    expect(result.current.selectedCall).toBeNull()
    expect(result.current.isSelectedLive).toBe(false)
  })

  test.each([
    {
      desc: "active by matching activeCallId even if status is unassigned",
      callStatus: "unassigned" as const,
      activeCallId: "call-target",
      expectedLive: true,
    },
    {
      desc: "active by call status active even if activeCallId is null",
      callStatus: "active" as const,
      activeCallId: null,
      expectedLive: true,
    },
    {
      desc: "inactive when status is unassigned and activeCallId is null",
      callStatus: "unassigned" as const,
      activeCallId: null,
      expectedLive: false,
    },
    {
      desc: "inactive when status is unassigned and activeCallId belongs to another call",
      callStatus: "unassigned" as const,
      activeCallId: "different-call",
      expectedLive: false,
    },
  ])(
    "determines isSelectedLive ($desc)",
    ({ callStatus, activeCallId, expectedLive }) => {
      const call = rttCallFactory.build({
        id: "call-target",
        status: callStatus,
      })

      const { result } = renderHook(() =>
        useRttSelection({
          selectedCallId: "call-target",
          activeCallId,
          incomingCalls: [call],
          pastCalls: [],
        })
      )

      expect(result.current.isSelectedLive).toBe(expectedLive)
    }
  )

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
