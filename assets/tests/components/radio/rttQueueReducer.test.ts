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

  test("RESPOND_CALL activates target call and sets responder and timestamps", () => {
    const call1 = rttCallFactory.build({ id: "call-1", status: "unassigned" })
    const initialState = createInitialRttQueueState({
      incomingCalls: [call1],
    })

    const answeredAt = new Date("2026-09-08T12:00:00Z")
    const nextState = rttQueueReducer(initialState, {
      type: "RESPOND_CALL",
      call: call1,
      currentDispatcherName: "Dispatcher Sam",
      answeredAt,
    })

    expect(nextState.activeCallId).toBe("call-1")
    expect(nextState.selectedCallId).toBe("call-1")
    expect(nextState.incomingCalls[0].status).toBe("active")
    expect(nextState.incomingCalls[0].respondedBy).toBe("Dispatcher Sam")
    expect(nextState.incomingCalls[0].answeredAt).toEqual(answeredAt)
  })

  test("RESPOND_CALL completes and moves prior active call to pastCalls", () => {
    const call1 = rttCallFactory.build({ id: "call-1", status: "active" })
    const call2 = rttCallFactory.build({ id: "call-2", status: "unassigned" })
    const initialState = createInitialRttQueueState({
      incomingCalls: [call1, call2],
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
    expect(nextState.incomingCalls.find((c) => c.id === "call-1")).toBeUndefined()
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

  test("RECEIVE_CALL prepends call and increments newIncomingCount when on past tab", () => {
    const call1 = rttCallFactory.build({ id: "call-1" })
    const newCall = rttCallFactory.build({ id: "call-2" })
    const initialState = createInitialRttQueueState({
      incomingCalls: [call1],
      tab: "past",
      newIncomingCount: 1,
    })

    const nextState = rttQueueReducer(initialState, {
      type: "RECEIVE_CALL",
      call: newCall,
    })

    expect(nextState.incomingCalls).toHaveLength(2)
    expect(nextState.incomingCalls[0].id).toBe("call-2")
    expect(nextState.newIncomingCount).toBe(2)
  })
})
