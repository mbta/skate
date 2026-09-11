import { describe, test, expect } from "@jest/globals"
import {
  sortRttCalls,
  CALL_TYPE_PRIORITY,
} from "../../../../src/components/radio/rtts/utils"
import { RttCallType } from "../../../../src/components/radio/rtts/types"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("RTT Domain & Sorting", () => {
  test.each([
    { callType: "Emergency" as RttCallType, expectedPriority: 1 },
    { callType: "PRTT" as RttCallType, expectedPriority: 2 },
    { callType: "RTT" as RttCallType, expectedPriority: 3 },
  ])(
    "assigns correct priority to $callType",
    ({ callType, expectedPriority }) => {
      expect(CALL_TYPE_PRIORITY[callType]).toBe(expectedPriority)
    }
  )

  test("sorts calls by priority (Emergency > PRTT > RTT) and then by timestamp (newest first)", () => {
    const olderTime = new Date("2026-09-03T10:00:00Z")
    const newerTime = new Date("2026-09-03T10:05:00Z")

    const newerRtt = rttCallFactory.build({
      id: "rtt-newer",
      callType: "RTT",
      receivedAt: newerTime,
    })
    const olderRtt = rttCallFactory.build({
      id: "rtt-older",
      callType: "RTT",
      receivedAt: olderTime,
    })
    const olderPrtt = rttCallFactory.build({
      id: "prtt-older",
      callType: "PRTT",
      receivedAt: olderTime,
    })
    const newerPrtt = rttCallFactory.build({
      id: "prtt-newer",
      callType: "PRTT",
      receivedAt: newerTime,
    })
    const olderEmergency = rttCallFactory.build({
      id: "emergency-older",
      callType: "Emergency",
      receivedAt: olderTime,
    })
    const newerEmergency = rttCallFactory.build({
      id: "emergency-newer",
      callType: "Emergency",
      receivedAt: newerTime,
    })

    const unsorted = [
      newerRtt,
      olderPrtt,
      olderEmergency,
      olderRtt,
      newerEmergency,
      newerPrtt,
    ]
    const sorted = sortRttCalls(unsorted)

    expect(sorted).toEqual([
      newerEmergency,
      olderEmergency,
      newerPrtt,
      olderPrtt,
      newerRtt,
      olderRtt,
    ])
  })

  test("sorts calls by timestamp descending when byPriority is false", () => {
    const olderPastCall = rttCallFactory.build({
      id: "call-older",
      receivedAt: "2026-09-08T10:00:00Z",
    })
    const newerPastCall = rttCallFactory.build({
      id: "call-newer",
      receivedAt: new Date("2026-09-08T10:10:00Z"),
    })

    const sorted = sortRttCalls([olderPastCall, newerPastCall], {
      byPriority: false,
    })
    expect(sorted).toEqual([newerPastCall, olderPastCall])
  })
})
