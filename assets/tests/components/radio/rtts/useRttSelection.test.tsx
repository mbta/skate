import { describe, test, expect } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useRttSelection } from "../../../../src/components/radio/rtts/useRttSelection"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("useRttSelection", () => {
  test("resolves selectedCall from incomingCalls or pastCalls without creating combined arrays", () => {
    const incomingCall = rttCallFactory.build({ id: "call-incoming" })
    const pastCall = rttCallFactory.build({ id: "call-past" })

    const { result, rerender } = renderHook(
      (props) =>
        useRttSelection({
          selectedCallId: props.selectedCallId,
          activeCallId: props.activeCallId,
          incomingCalls: [incomingCall],
          pastCalls: [pastCall],
        }),
      {
        initialProps: {
          selectedCallId: incomingCall.id,
          activeCallId: null as string | null,
        },
      }
    )

    expect(result.current.selectedCall).toEqual(incomingCall)
    expect(result.current.isSelectedLive).toBe(false)

    // Select call from pastCalls
    rerender({ selectedCallId: pastCall.id, activeCallId: null })
    expect(result.current.selectedCall).toEqual(pastCall)
  })

  test("returns null selectedCall and false isSelectedLive when selectedCallId does not exist", () => {
    const call = rttCallFactory.build({ id: "call-1" })

    const { result } = renderHook(() =>
      useRttSelection({
        selectedCallId: "non-existent-id",
        activeCallId: null,
        incomingCalls: [call],
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
      const targetCall = rttCallFactory.build({
        id: "call-target",
        status: callStatus,
      })

      const { result } = renderHook(() =>
        useRttSelection({
          selectedCallId: targetCall.id,
          activeCallId,
          incomingCalls: [targetCall],
          pastCalls: [],
        })
      )

      expect(result.current.isSelectedLive).toBe(expectedLive)
    }
  )

  test("handleSelectCall dispatches action and invokes onSelectCall", () => {
    const targetCall = rttCallFactory.build({ id: "call-select" })
    let dispatchedId: string | null = null
    let callbackCalledWith: typeof targetCall | null = null

    const { result } = renderHook(() =>
      useRttSelection({
        selectedCallId: null,
        activeCallId: null,
        incomingCalls: [targetCall],
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
      result.current.handleSelectCall(targetCall)
    })

    expect(dispatchedId).toBe(targetCall.id)
    expect(callbackCalledWith).toEqual(targetCall)
  })
})
