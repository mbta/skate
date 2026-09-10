import { describe, test, expect } from "@jest/globals"
import {
  sortRttCalls,
  sortPastRttCalls,
  getCallTimestamp,
  CALL_TYPE_PRIORITY,
} from "../../../src/components/radio/rtts/utils"
import { RttCallType } from "../../../src/components/radio/rtts/types"
import { rttCallFactory } from "../../factories/radio/rtt"

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

    const rttNew = rttCallFactory.build({
      callType: "RTT",
      receivedAt: newerTime,
    })
    const rttOld = rttCallFactory.build({
      callType: "RTT",
      receivedAt: olderTime,
    })
    const prttOld = rttCallFactory.build({
      callType: "PRTT",
      receivedAt: olderTime,
    })
    const prttNew = rttCallFactory.build({
      callType: "PRTT",
      receivedAt: newerTime,
    })
    const emergencyOld = rttCallFactory.build({
      callType: "Emergency",
      receivedAt: olderTime,
    })
    const emergencyNew = rttCallFactory.build({
      callType: "Emergency",
      receivedAt: newerTime,
    })

    const unsorted = [
      rttNew,
      prttOld,
      emergencyOld,
      rttOld,
      emergencyNew,
      prttNew,
    ]
    const sorted = sortRttCalls(unsorted)

    expect(
      sorted.map((c) => `${c.callType}-${new Date(c.receivedAt).toISOString()}`)
    ).toEqual([
      `Emergency-${new Date(emergencyNew.receivedAt).toISOString()}`,
      `Emergency-${new Date(emergencyOld.receivedAt).toISOString()}`,
      `PRTT-${new Date(prttNew.receivedAt).toISOString()}`,
      `PRTT-${new Date(prttOld.receivedAt).toISOString()}`,
      `RTT-${new Date(rttNew.receivedAt).toISOString()}`,
      `RTT-${new Date(rttOld.receivedAt).toISOString()}`,
    ])
  })

  test("getCallTimestamp converts Date objects and string representations to epochs", () => {
    const epoch = 1788886890000
    const dateObj = new Date(epoch)
    const dateStr = dateObj.toISOString()

    expect(getCallTimestamp(dateObj)).toBe(epoch)
    expect(getCallTimestamp(dateStr)).toBe(epoch)
  })

  test("sortPastRttCalls sorts calls by timestamp descending (newest first)", () => {
    const callOld = rttCallFactory.build({
      id: "old",
      receivedAt: "2026-09-08T10:00:00Z",
    })
    const callNew = rttCallFactory.build({
      id: "new",
      receivedAt: new Date("2026-09-08T10:10:00Z"),
    })

    const sorted = sortPastRttCalls([callOld, callNew])
    expect(sorted.map((c) => c.id)).toEqual(["new", "old"])
  })
})
