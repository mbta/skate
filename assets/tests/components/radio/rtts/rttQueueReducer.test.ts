import { describe, test, expect } from "@jest/globals"
import {
  rttQueueReducer,
  createInitialRttQueueState,
} from "../../../../src/components/radio/rtts/rttQueueReducer"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("rttQueueReducer", () => {
  test("CHANGE_TAB updates tab and clears newIncomingCount when moving to incoming", () => {
    const initialState = createInitialRttQueueState({
      tab: "past",
      newIncomingCount: 5,
    })

    const nextState = rttQueueReducer(initialState, {
      type: "CHANGE_TAB",
      tab: "incoming",
    })

    expect(nextState.tab).toBe("incoming")
    expect(nextState.newIncomingCount).toBe(0)
  })

  test("SELECT_CALL updates selectedCallId", () => {
    const selectedCallId = "call-123"
    const initialState = createInitialRttQueueState({
      selectedCallId: null,
    })

    const nextState = rttQueueReducer(initialState, {
      type: "SELECT_CALL",
      callId: selectedCallId,
    })

    expect(nextState.selectedCallId).toBe(selectedCallId)
  })

  test("RESPOND_CALL activates target call and sets responder and timestamps with fallback defaults", () => {
    const targetCall = rttCallFactory.build({
      id: "call-1",
      status: "unassigned",
    })
    const initialState = createInitialRttQueueState({
      incomingCalls: [targetCall],
    })

    const nextState = rttQueueReducer(initialState, {
      type: "RESPOND_CALL",
      call: targetCall,
    })

    expect(nextState.activeCallId).toBe(targetCall.id)
    expect(nextState.selectedCallId).toBe(targetCall.id)
    expect(nextState.incomingCalls[0]).toEqual(
      expect.objectContaining({
        id: targetCall.id,
        status: "active",
        respondedBy: "Current Dispatcher",
        answeredAt: expect.any(Date),
      })
    )
  })

  test("RESPOND_CALL completes and moves prior active call to pastCalls while preserving other calls", () => {
    const priorActiveCall = rttCallFactory.build({
      id: "call-1",
      status: "active",
    })
    const targetCall = rttCallFactory.build({
      id: "call-2",
      status: "unassigned",
    })
    const remainingCall = rttCallFactory.build({
      id: "call-3",
      status: "unassigned",
    })
    const initialState = createInitialRttQueueState({
      incomingCalls: [priorActiveCall, targetCall, remainingCall],
      activeCallId: priorActiveCall.id,
      pastCalls: [],
    })

    const answeredAt = new Date("2026-09-08T12:05:00Z")
    const nextState = rttQueueReducer(initialState, {
      type: "RESPOND_CALL",
      call: targetCall,
      answeredAt,
    })

    expect(nextState.activeCallId).toBe(targetCall.id)
    expect(nextState.incomingCalls.map((c) => c.id)).toEqual([
      targetCall.id,
      remainingCall.id,
    ])
    expect(nextState.pastCalls).toEqual([
      expect.objectContaining({
        id: priorActiveCall.id,
        status: "done",
        markedDoneAt: answeredAt,
      }),
    ])
  })

  test("MARK_DONE_CALL removes call from incoming and adds to pastCalls", () => {
    const activeCall = rttCallFactory.build({ id: "call-1", status: "active" })
    const initialState = createInitialRttQueueState({
      incomingCalls: [activeCall],
      activeCallId: activeCall.id,
      selectedCallId: activeCall.id,
      pastCalls: [],
    })

    const markedDoneAt = new Date("2026-09-08T12:10:00Z")
    const nextState = rttQueueReducer(initialState, {
      type: "MARK_DONE_CALL",
      call: activeCall,
      markedDoneAt,
    })

    expect(nextState.activeCallId).toBeNull()
    expect(nextState.incomingCalls).toEqual([])
    expect(nextState.pastCalls).toEqual([
      expect.objectContaining({
        id: activeCall.id,
        status: "done",
        markedDoneAt,
      }),
    ])
  })

  test("MARK_DONE_CALL on non-active call preserves current activeCallId and generates default timestamp", () => {
    const activeCall = rttCallFactory.build({
      id: "call-active",
      status: "active",
    })
    const otherCall = rttCallFactory.build({
      id: "call-other",
      status: "unassigned",
    })
    const initialState = createInitialRttQueueState({
      incomingCalls: [activeCall, otherCall],
      activeCallId: activeCall.id,
      selectedCallId: activeCall.id,
      pastCalls: [],
    })

    const nextState = rttQueueReducer(initialState, {
      type: "MARK_DONE_CALL",
      call: otherCall,
    })

    expect(nextState.activeCallId).toBe(activeCall.id)
    expect(nextState.incomingCalls).toEqual([activeCall])
    expect(nextState.pastCalls).toEqual([
      expect.objectContaining({
        id: otherCall.id,
        status: "done",
        markedDoneAt: expect.any(Date),
      }),
    ])
  })

  test.each([
    {
      tab: "past" as const,
      initialBadge: 1,
      expectedBadge: 2,
      desc: "increments newIncomingCount on past tab",
    },
    {
      tab: "incoming" as const,
      initialBadge: 0,
      expectedBadge: 0,
      desc: "does not increment newIncomingCount on incoming tab",
    },
  ])("RECEIVE_CALL $desc", ({ tab, initialBadge, expectedBadge }) => {
    const existingCall = rttCallFactory.build({ id: "call-existing" })
    const newCall = rttCallFactory.build({ id: "call-new" })
    const initialState = createInitialRttQueueState({
      incomingCalls: [existingCall],
      tab,
      newIncomingCount: initialBadge,
    })

    const nextState = rttQueueReducer(initialState, {
      type: "RECEIVE_CALL",
      call: newCall,
    })

    expect(nextState.incomingCalls).toEqual([newCall, existingCall])
    expect(nextState.newIncomingCount).toBe(expectedBadge)
  })

  test("RESET applies payload overrides to state", () => {
    const initialState = createInitialRttQueueState({
      tab: "incoming",
      newIncomingCount: 0,
      activeCallId: "active-call",
    })

    const nextState = rttQueueReducer(initialState, {
      type: "RESET",
      payload: {
        tab: "past",
        newIncomingCount: 4,
        activeCallId: null,
      },
    })

    expect(nextState.tab).toBe("past")
    expect(nextState.newIncomingCount).toBe(4)
    expect(nextState.activeCallId).toBeNull()
  })
})
