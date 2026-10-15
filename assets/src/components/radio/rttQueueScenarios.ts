import { InitialRttQueueState } from "./rtts/rttQueueReducer"
import { RttCall, TAB_TYPE } from "./rtts"
import { Scenario } from "../research/scenarios/types"

export type RttQueueScenarioId =
  | "standard_scenario"
  | "stress_case_scenario"
  | "prtt_scenario"
  | "past_rtt_scenario"

export type RttQueueScenario = Scenario<
  InitialRttQueueState,
  RttQueueScenarioId
>

export const RTT_QUEUE_SCENARIO_TOPIC = "research:scenarios:rtt_queue"

const createCall = (
  call: Partial<RttCall> &
    Pick<
      RttCall,
      "id" | "callType" | "routeId" | "routeName" | "vehicleId" | "status"
    >
): RttCall => ({
  talkGroup: "Cabot",
  garage: "Cabot",
  receivedAt: "2026-10-14T14:00:00.000Z",
  direction: "Outbound",
  variant: "Standard Route",
  currentLocation: "Washington St @ Mass Ave",
  operatorBadge: "50123",
  operatorName: "Jane Doe",
  runNumber: "123-1023",
  adherence: "On time",
  respondedBy: null,
  answeredAt: null,
  markedDoneAt: null,
  ...call,
})

const RECENT_BASE_TIME = new Date("2026-10-14T14:00:00.000Z")

const minutesBefore = (base: Date, minutes: number): string =>
  new Date(base.getTime() - minutes * 60_000).toISOString()

const stressTalkGroups = ["Cabot", "Charlestown", "Southampton", "Albany"]
const stressGarages = ["Cabot", "Charlestown", "Southampton", "Albany"]

const placeholderNames = [
  "John Doe",
  "Jane Doe",
  "Liam Doe",
  "Olivia Doe",
  "John Smith",
  "Jane Smith",
  "Liam Smith",
  "Olivia Smith",
]

// generates incoming rtt calls with semi-random values
const STRESS_CASE_INCOMING_CALLS: readonly RttCall[] = Array.from(
  { length: 30 },
  (_, index) => {
    const talkGroup = stressTalkGroups[index % stressTalkGroups.length]
    const garage = stressGarages[index % stressGarages.length]
    const operatorName = placeholderNames[index % placeholderNames.length]
    const callId = `stress-rtt-${index + 1}`
    const isExternalActiveCall = index === 26

    return createCall({
      id: callId,
      callType: "RTT",
      routeId: `${1 + ((index * 7) % 116)}`,
      routeName: `${1 + ((index * 7) % 116)}`,
      vehicleId: `${3201 + index}`,
      status: isExternalActiveCall ? "active" : "unassigned",
      talkGroup,
      garage,
      receivedAt: minutesBefore(RECENT_BASE_TIME, 30 - index),
      respondedBy: isExternalActiveCall ? "Dispatcher Morgan" : null,
      answeredAt: isExternalActiveCall
        ? minutesBefore(RECENT_BASE_TIME, 30 - index - 1)
        : null,
      operatorBadge: `${53000 + index}`,
      operatorName: operatorName,
      runNumber: `123-${1200 + index * 3}`,
      adherence:
        index % 3 === 0
          ? "11 min late"
          : index % 3 === 1
            ? "On time"
            : "5 min early",
    })
  }
)

// generates past rtt calls with semi-random values
const PAST_RTT_CALLS: readonly RttCall[] = Array.from(
  { length: 32 },
  (_, index) =>
    createCall({
      id: `past-rtt-${index + 1}`,
      callType: "RTT",
      routeId: `${1 + ((index * 5) % 116)}`,
      routeName: `${1 + ((index * 5) % 116)}`,
      vehicleId: `${4101 + index}`,
      status: "done",
      talkGroup: "Cabot",
      garage: "Cabot",
      receivedAt: minutesBefore(RECENT_BASE_TIME, 60 + index * 20),
      answeredAt: minutesBefore(RECENT_BASE_TIME, 55 + index * 20),
      markedDoneAt: minutesBefore(RECENT_BASE_TIME, 50 + index * 20),
      operatorBadge: `${54000 + index}`,
      operatorName: placeholderNames[index % placeholderNames.length],
      runNumber: `123-${1300 + index * 3}`,
      adherence: index % 2 === 0 ? "On time" : "8 min late",
    })
)

export const SAMPLE_RTT_QUEUE_SCENARIOS: readonly RttQueueScenario[] = [
  {
    id: "standard_scenario",
    name: "Standard",
    description:
      "Two RTTs from the same talk group for a typical RTT workflow.",
    data: {
      tab: TAB_TYPE.INCOMING,
      incomingCalls: [
        createCall({
          id: "standard-rtt-1",
          callType: "RTT",
          routeId: "22",
          routeName: "22",
          vehicleId: "1901",
          status: "unassigned",
          talkGroup: "Cabot",
          garage: "Cabot",
          receivedAt: "2026-10-14T14:00:45.000Z",
          currentLocation: "Mass Ave @ Melnea Cass Blvd",
          operatorBadge: "50123",
          operatorName: "John Doe",
          runNumber: "123-1431",
        }),
        createCall({
          id: "standard-rtt-2",
          callType: "RTT",
          routeId: "28",
          routeName: "28",
          vehicleId: "1902",
          status: "unassigned",
          receivedAt: "2026-10-14T14:01:00.000Z",
          garage: "Cabot",
          talkGroup: "Cabot",
          operatorBadge: "50124",
          operatorName: "Jane Doe",
          runNumber: "123-1020",
          currentLocation: "Blue Hill Ave @ Dudley St",
        }),
      ],
      selectedCallId: "standard-rtt-1",
    },
  },
  {
    id: "stress_case_scenario",
    name: "Stress case",
    description:
      "Thirty RTTs across multiple talk groups with one already active for another dispatcher.",
    data: {
      tab: TAB_TYPE.INCOMING,
      incomingCalls: [...STRESS_CASE_INCOMING_CALLS],
      selectedCallId: "stress-rtt-1",
      activeCallId: "stress-rtt-7",
    },
  },
  {
    id: "prtt_scenario",
    name: "PRTT",
    description:
      "Two RTTs plus one PRTT to validate the priority response flow.",
    data: {
      tab: TAB_TYPE.INCOMING,
      incomingCalls: [
        createCall({
          id: "prtt-rtt-1",
          callType: "RTT",
          routeId: "66",
          routeName: "66",
          vehicleId: "3901",
          status: "unassigned",
          garage: "Cabot",
          talkGroup: "Cabot",
          receivedAt: "2026-10-14T14:03:15.000Z",
          currentLocation: "Harvard Ave @ Brighton Ave",
          operatorBadge: "50122",
          operatorName: "John Doe",
          adherence: "23 min late",
        }),
        createCall({
          id: "prtt-rtt-2",
          callType: "RTT",
          routeId: "43",
          routeName: "43",
          vehicleId: "3902",
          status: "unassigned",
          garage: "Cabot",
          talkGroup: "Cabot",
          receivedAt: "2026-10-14T14:04:00.000Z",
          operatorBadge: "50123",
          operatorName: "Jane Doe",
          currentLocation: "Central Sq",
        }),
        createCall({
          id: "prtt-priority-1",
          callType: "PRTT",
          routeId: "45",
          routeName: "45",
          vehicleId: "3903",
          status: "unassigned",
          garage: "Cabot",
          talkGroup: "Cabot",
          receivedAt: "2026-10-14T14:04:30.000Z",
          operatorBadge: "50125",
          operatorName: "Liam Doe",
          runNumber: "123-1054",
          currentLocation: "Union Sq",
        }),
      ],
      selectedCallId: "prtt-priority-1",
    },
  },
  {
    id: "past_rtt_scenario",
    name: "Past RTT",
    description:
      "An incoming-first view with more than 30 recently answered past RTTs available on the Past tab.",
    data: {
      tab: TAB_TYPE.INCOMING,
      incomingCalls: [],
      pastCalls: [...PAST_RTT_CALLS],
      selectedCallId: null,
    },
  },
]
