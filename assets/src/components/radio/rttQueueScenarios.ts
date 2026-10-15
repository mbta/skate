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
const RECENT_BASE_TIME = new Date()

const minutesBefore = (base: Date, minutes: number): string =>
  new Date(base.getTime() - minutes * 60_000).toISOString()

const addresses = [
  "123 Haywood Ave, Somerville MA 01381",
  "240 Washington St, Boston, MA 02108",
  "177 Milk St, Boston, MA 02109",
  "800 Boylston St, Boston, MA 02199",
  "392 Columbus Ave, Boston, MA 02116",
  "125 Nashua St, Boston, MA 02114",
  "700 Commonwealth Ave, Boston, MA 02215",
  "54 Cumberland St, Boston, MA 02115",
  "451 Hanover St, Boston, MA 02113",
  "100 William T Morrissey Blvd, Boston, MA 02125",
  "241 Perimeter Rd, Boston, MA 02125",
]

const stressGarages = ["Cabot", "Charlestown", "Southampton", "Albany"]

const generateName = (index: number): string => {
  const firstNames = ["John", "Jane", "Liam", "Olivia", "Noah", "Maria"]
  const surnames = ["Doe", "Smith", "Lee", "Jones"]

  return `${firstNames[index % firstNames.length]} ${surnames[index % surnames.length]}`
}

const createCall = (
  call: Partial<RttCall> & Pick<RttCall, "id" | "callType" | "status">,
  index: number = 0
): RttCall => ({
  routeId: `${1 + ((index * 7) % 116)}`,
  routeName: `${1 + ((index * 7) % 116)}`,
  vehicleId: `${3201 + index}`,
  talkGroup: "Cabot",
  garage: "Cabot",
  receivedAt: minutesBefore(RECENT_BASE_TIME, 30 - index),
  direction: "Outbound",
  variant: "Standard Route",
  currentLocation: addresses[index % addresses.length],
  operatorBadge: `${54000 + index}`,
  operatorName: generateName(index),
  runNumber: `123-${1200 + index * 3}`,
  adherence: "On time",
  respondedBy: null,
  answeredAt: null,
  markedDoneAt: null,
  ...call,
})

const STANDARD_CALLS: readonly RttCall[] = Array.from(
  { length: 2 },
  (_, index) =>
    createCall(
      {
        id: `standard-rtt-${index + 1}`,
        callType: "RTT",
        status: "unassigned",
      },
      index
    )
)

// generates incoming rtt calls with semi-random values
const STRESS_CASE_INCOMING_CALLS: readonly RttCall[] = Array.from(
  { length: 30 },
  (_, index) => {
    const garage = stressGarages[index % stressGarages.length]
    const talkGroup = garage
    const isExternalActiveCall = index === 26

    return createCall(
      {
        id: `stress-rtt-${index + 1}`,
        callType: "RTT",
        status: isExternalActiveCall ? "active" : "unassigned",
        talkGroup,
        garage,
        receivedAt: minutesBefore(RECENT_BASE_TIME, 30 - index),
        respondedBy: isExternalActiveCall ? "Dispatcher Morgan" : null,
        answeredAt: isExternalActiveCall
          ? minutesBefore(RECENT_BASE_TIME, 30 - index - 1)
          : null,
        adherence:
          index % 3 === 0
            ? "11 min late"
            : index % 3 === 1
              ? "On time"
              : "5 min early",
      },
      index
    )
  }
)

const PRTT_CASE_CALLS: readonly RttCall[] = Array.from(
  { length: 3 },
  (_, index) =>
    createCall(
      {
        id: `prtt-rtt-${index + 1}`,
        callType: index === 2 ? "PRTT" : "RTT",
        status: "unassigned",
        adherence: index === 0 ? "23 min late" : undefined,
      },
      index
    )
)

// generates past rtt calls with semi-random values
const PAST_RTT_CALLS: readonly RttCall[] = Array.from(
  { length: 32 },
  (_, index) =>
    createCall(
      {
        id: `past-rtt-${index + 1}`,
        callType: "RTT",
        vehicleId: `${4101 + index}`,
        status: "done",
        receivedAt: minutesBefore(RECENT_BASE_TIME, 60 + index * 20),
        answeredAt: minutesBefore(RECENT_BASE_TIME, 55 + index * 20),
        markedDoneAt: minutesBefore(RECENT_BASE_TIME, 50 + index * 20),
        adherence: index % 2 === 0 ? "On time" : "8 min late",
      },
      index
    )
)

export const SAMPLE_RTT_QUEUE_SCENARIOS: readonly RttQueueScenario[] = [
  {
    id: "standard_scenario",
    name: "Standard",
    description:
      "Two RTTs from the same talk group for a typical RTT workflow.",
    data: {
      tab: TAB_TYPE.INCOMING,
      incomingCalls: [...STANDARD_CALLS],
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
      incomingCalls: [...PRTT_CASE_CALLS],
      selectedCallId: "prtt-rtt-3",
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
