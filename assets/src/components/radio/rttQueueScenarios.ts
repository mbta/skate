import { InitialRttQueueState } from "./rtts/rttQueueReducer"
import { RttCall, TAB_TYPE } from "./rtts"
import { Scenario } from "../research/scenarios/types"

export type RttQueueScenarioId =
	| "baseline_scenario"
	| "high_stress_scenario"
	| "edge_case_scenario"

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
	operatorName: "Operator One",
	runNumber: "R-101",
	adherence: "On time",
	respondedBy: null,
	answeredAt: null,
	markedDoneAt: null,
	...call,
})

export const SAMPLE_RTT_QUEUE_SCENARIOS: readonly RttQueueScenario[] = [
	{
		id: "baseline_scenario",
		name: "Baseline Scenario",
		description: "Standard initial state for research session",
		data: {
			tab: TAB_TYPE.INCOMING,
			incomingCalls: [
				createCall({
					id: "baseline-active",
					callType: "RTT",
					routeId: "22",
					routeName: "22",
					vehicleId: "1901",
					status: "active",
					respondedBy: "Dispatcher Lane",
					answeredAt: "2026-10-14T14:00:45.000Z",
				}),
				createCall({
					id: "baseline-next",
					callType: "PRTT",
					routeId: "28",
					routeName: "28",
					vehicleId: "1902",
					status: "unassigned",
					receivedAt: "2026-10-14T14:01:00.000Z",
					garage: "Charlestown",
					talkGroup: "Charlestown",
					operatorBadge: "50124",
					operatorName: "Operator Two",
					runNumber: "R-102",
				}),
			],
			selectedCallId: "baseline-active",
			activeCallId: "baseline-active",
		},
	},
	{
		id: "high_stress_scenario",
		name: "High Stress Scenario",
		description: "Stress case with high volume of activity",
		data: {
			tab: TAB_TYPE.INCOMING,
			incomingCalls: [
				createCall({
					id: "stress-emergency",
					callType: "Emergency",
					routeId: "39",
					routeName: "39",
					vehicleId: "2901",
					status: "unassigned",
					receivedAt: "2026-10-14T14:02:00.000Z",
					garage: "Southampton",
					talkGroup: "Southampton",
					adherence: "17 min late",
				}),
				createCall({
					id: "stress-rtt",
					callType: "RTT",
					routeId: "111",
					routeName: "111",
					vehicleId: "2902",
					status: "active",
					respondedBy: "Dispatcher Cole",
					answeredAt: "2026-10-14T14:02:30.000Z",
					receivedAt: "2026-10-14T14:01:45.000Z",
				}),
				createCall({
					id: "stress-prtt",
					callType: "PRTT",
					routeId: "57",
					routeName: "57",
					vehicleId: "2903",
					status: "unassigned",
					receivedAt: "2026-10-14T14:03:00.000Z",
					garage: "Albany",
					talkGroup: "Albany",
				}),
			],
			pastCalls: [
				createCall({
					id: "stress-past",
					callType: "RTT",
					routeId: "1",
					routeName: "1",
					vehicleId: "2891",
					status: "done",
					receivedAt: "2026-10-14T13:53:00.000Z",
					answeredAt: "2026-10-14T13:53:30.000Z",
					markedDoneAt: "2026-10-14T13:58:00.000Z",
				}),
			],
			selectedCallId: "stress-emergency",
			activeCallId: "stress-rtt",
		},
	},
	{
		id: "edge_case_scenario",
		name: "Edge Case Scenario",
		description: "Unusual inputs and rare state transitions",
		data: {
			tab: TAB_TYPE.PAST,
			incomingCalls: [
				createCall({
					id: "edge-live",
					callType: "Emergency",
					routeId: "66",
					routeName: "66",
					vehicleId: "3901",
					status: "active",
					respondedBy: "Dispatcher Gray",
					answeredAt: "2026-10-14T14:04:15.000Z",
					currentLocation: "Harvard Ave @ Brighton Ave",
					adherence: "23 min late",
				}),
			],
			pastCalls: [
				createCall({
					id: "edge-complete",
					callType: "PRTT",
					routeId: "47",
					routeName: "47",
					vehicleId: "3902",
					status: "done",
					receivedAt: "2026-10-14T13:45:00.000Z",
					answeredAt: "2026-10-14T13:46:00.000Z",
					markedDoneAt: "2026-10-14T13:55:00.000Z",
					garage: "Albany",
					talkGroup: "Albany",
				}),
			],
			selectedCallId: "edge-complete",
			activeCallId: "edge-live",
			newIncomingCount: 1,
		},
	},
]
