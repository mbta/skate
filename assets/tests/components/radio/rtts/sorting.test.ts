import { describe, test, expect } from "@jest/globals"
import { sortRttCalls } from "../../../../src/components/radio/rtts/sorting"
import { rttCallFactory } from "../../../factories/radio/rtt"

describe("RTT Sorting", () => {
  const olderTime = new Date("2026-09-03T10:00:00Z")
  const newerTime = new Date("2026-09-03T10:05:00Z")

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
  const olderRtt = rttCallFactory.build({
    id: "rtt-older",
    callType: "RTT",
    receivedAt: olderTime,
  })
  const newerRtt = rttCallFactory.build({
    id: "rtt-newer",
    callType: "RTT",
    receivedAt: newerTime,
  })

  const unsortedCalls = [
    newerRtt,
    olderPrtt,
    olderEmergency,
    olderRtt,
    newerEmergency,
    newerPrtt,
  ]

  test.each([
    {
      desc: "by priority (Emergency > PRTT > RTT) then timestamp descending by default",
      options: undefined,
      expectedOrder: [
        newerEmergency,
        olderEmergency,
        newerPrtt,
        olderPrtt,
        newerRtt,
        olderRtt,
      ],
    },
    {
      desc: "purely by timestamp descending when byPriority is false",
      options: { byPriority: false },
      expectedOrder: [
        newerRtt,
        newerEmergency,
        newerPrtt,
        olderPrtt,
        olderEmergency,
        olderRtt,
      ],
    },
  ])("sorts calls $desc", ({ options, expectedOrder }) => {
    const sorted = sortRttCalls(unsortedCalls, options)
    expect(sorted.map((c) => c.id)).toEqual(expectedOrder.map((c) => c.id))
  })
})
