import { describe, test, expect } from "@jest/globals"
import {
  rttQueueReducer,
  createInitialRttQueueState,
} from "../../../src/components/radio/rtts/rttQueueReducer"
import { rttCallFactory } from "../../factories/radio/rtt"

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
    const initialState = createInitialRttQueueState({
      selectedCallId: null,
    })

    const nextState = rttQueueReducer(initialState, {
      type: "SELECT_CALL",
      callId: "call-123",
    })

    expect(nextState.selectedCallId).toBe("call-123")
  })

  test("RESPOND_CALL activates target call and sets responder and timestamps with fallback defaults", () => {
    const call1 = rttCallFactory.build({ id: "call-1", status: "unassigned" })
    const initialState = createInitialRttQueueState({
      incomingCalls: [call1],
    })

    const before = Date.now()
    const nextState = rttQueueReducer(initialState, {
      type: "RESPOND_CALL",
      call: call1,
    })
    const after = Date.now()

    expect(nextState.activeCallId).toBe("call-1")
    expect(nextState.selectedCallId).toBe("call-1")
    expect(nextState.incomingCalls[0].status).toBe("active")
    expect(nextState.incomingCalls[0].respondedBy).toBe("Current Dispatcher")
    expect(nextState.incomingCalls[0].answeredAt).toBeDefined()
    const answeredTime = new Date(
      nextState.incomingCalls[0].answeredAt!
    ).getTime()
    expect(answeredTime).toBeGreaterThanOrEqual(before)
    expect(answeredTime).toBeLessThanOrEqual(after)
  })

  test("RESPOND_CALL completes and moves prior active call to pastCalls while preserving other calls", () => {
    const call1 = rttCallFactory.build({ id: "call-1", status: "active" })
    const call2 = rttCallFactory.build({ id: "call-2", status: "unassigned" })
    const call3 = rttCallFactory.build({ id: "call-3", status: "unassigned" })
    const initialState = createInitialRttQueueState({
      incomingCalls: [call1, call2, call3],
      activeCallId: "call-1",
      pastCalls: [],
    })

    const answeredAt = new Date("2026-09-08T12:05:00Z")
    const nextState = rttQueueReducer(initialState, {
      type: "RESPOND_CALL",
      call: call2,
      answeredAt,
    })

    expect(nextState.activeCallId).toBe("call-2")
    expect(
      nextState.incomingCalls.find((c) => c.id === "call-1")
    ).toBeUndefined()
    expect(nextState.incomingCalls.map((c) => c.id)).toEqual([
      "call-2",
      "call-3",
    ])
    expect(nextState.pastCalls).toHaveLength(1)
    expect(nextState.pastCalls[0].id).toBe("call-1")
    expect(nextState.pastCalls[0].status).toBe("done")
    expect(nextState.pastCalls[0].markedDoneAt).toEqual(answeredAt)
  })

  test("MARK_DONE_CALL removes call from incoming and adds to pastCalls", () => {
    const call1 = rttCallFactory.build({ id: "call-1", status: "active" })
    const initialState = createInitialRttQueueState({
      incomingCalls: [call1],
      activeCallId: "call-1",
      selectedCallId: "call-1",
      pastCalls: [],
    })

    const markedDoneAt = new Date("2026-09-08T12:10:00Z")
    const nextState = rttQueueReducer(initialState, {
      type: "MARK_DONE_CALL",
      call: call1,
      markedDoneAt,
    })

    expect(nextState.activeCallId).toBeNull()
    expect(nextState.incomingCalls).toHaveLength(0)
    expect(nextState.pastCalls).toHaveLength(1)
    expect(nextState.pastCalls[0].status).toBe("done")
    expect(nextState.pastCalls[0].markedDoneAt).toEqual(markedDoneAt)
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
      activeCallId: "call-active",
      selectedCallId: "call-active",
      pastCalls: [],
    })

    const before = Date.now()
    const nextState = rttQueueReducer(initialState, {
      type: "MARK_DONE_CALL",
      call: otherCall,
    })
    const after = Date.now()

    expect(nextState.activeCallId).toBe("call-active")
    expect(nextState.incomingCalls.map((c) => c.id)).toEqual(["call-active"])
    expect(nextState.pastCalls).toHaveLength(1)
    expect(nextState.pastCalls[0].id).toBe("call-other")
    expect(nextState.pastCalls[0].status).toBe("done")
    const doneTime = new Date(nextState.pastCalls[0].markedDoneAt!).getTime()
    expect(doneTime).toBeGreaterThanOrEqual(before)
    expect(doneTime).toBeLessThanOrEqual(after)
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

    expect(nextState.incomingCalls).toHaveLength(2)
    expect(nextState.incomingCalls[0].id).toBe("call-new")
    expect(nextState.incomingCalls[1].id).toBe("call-existing")
    expect(nextState.newIncomingCount).toBe(expectedBadge)
  })

  test("RESET applies payload overrides to state", () => {
    const initialState = createInitialRttQueueState({
      tab: "incoming",
      newIncomingCount: 0,
      activeCallId: "call-1",
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
