import { RttCall } from "../../../../../src/components/radio/rtts/types"

const now = new Date()

export const mockEmergencyCall: RttCall = {
  id: "rtt-call-001",
  callType: "Emergency",
  talkGroup: "TG-102",
  routeId: "66",
  routeName: "66",
  vehicleId: "2104",
  garage: "Cabot",
  receivedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 mins ago
  direction: "Outbound",
  variant: "Harvard via Allston",
  currentLocation: "Harvard Ave @ Commonwealth Ave",
  operatorBadge: "54321",
  operatorName: "J. Doe",
  runNumber: "R-104",
  respondedBy: null,
  answeredAt: null,
  markedDoneAt: null,
  status: "unassigned",
}

export const mockPrttCall: RttCall = {
  id: "rtt-call-002",
  callType: "PRTT",
  talkGroup: "TG-105",
  routeId: "39",
  routeName: "39",
  vehicleId: "1845",
  garage: "Southampton",
  receivedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago
  direction: "Inbound",
  variant: "Forest Hills - Back Bay Station",
  currentLocation: "Huntington Ave @ Longwood Ave",
  operatorBadge: "48291",
  operatorName: "M. Garcia",
  runNumber: "R-039",
  respondedBy: null,
  answeredAt: null,
  markedDoneAt: null,
  status: "unassigned",
}

export const mockActivePrttCallByOther: RttCall = {
  id: "rtt-call-003",
  callType: "PRTT",
  talkGroup: "TG-101",
  routeId: "1",
  routeName: "1",
  vehicleId: "1290",
  garage: "Southampton",
  receivedAt: new Date(now.getTime() - 7 * 60 * 1000), // 7 mins ago
  direction: "Outbound",
  variant: "Harvard - Nubian Station",
  currentLocation: "Mass Ave @ Beacon St",
  operatorBadge: "50122",
  operatorName: "T. Vance",
  runNumber: "R-001",
  respondedBy: "Sarah Connor",
  answeredAt: new Date(now.getTime() - 4 * 60 * 1000),
  markedDoneAt: null,
  status: "active",
}

export const mockStandardRttCall1: RttCall = {
  id: "rtt-call-004",
  callType: "RTT",
  talkGroup: "TG-104",
  routeId: "57",
  routeName: "57",
  vehicleId: "1932",
  garage: "Cabot",
  receivedAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 mins ago
  direction: "Inbound",
  variant: "Watertown Yard - Kenmore",
  currentLocation: "Commonwealth Ave @ Warren St",
  operatorBadge: "39481",
  operatorName: "K. Patel",
  runNumber: "R-057",
  respondedBy: null,
  answeredAt: null,
  markedDoneAt: null,
  status: "unassigned",
}

export const mockStandardRttCall2: RttCall = {
  id: "rtt-call-005",
  callType: "RTT",
  talkGroup: "TG-108",
  routeId: "111",
  routeName: "111",
  vehicleId: "2055",
  garage: "Charlestown",
  receivedAt: new Date(now.getTime() - 12 * 60 * 1000), // 12 mins ago
  direction: "Outbound",
  variant: "Woodlawn - Haymarket",
  currentLocation: "Broadway @ Chelsea St",
  operatorBadge: "41902",
  operatorName: "L. Martinez",
  runNumber: "R-111",
  respondedBy: null,
  answeredAt: null,
  markedDoneAt: null,
  status: "unassigned",
}

export const mockIncomingCalls: RttCall[] = [
  mockEmergencyCall,
  mockPrttCall,
  mockActivePrttCallByOther,
  mockStandardRttCall1,
  mockStandardRttCall2,
]

export const mockPastCall1: RttCall = {
  id: "rtt-past-001",
  callType: "RTT",
  talkGroup: "TG-102",
  routeId: "28",
  routeName: "28",
  vehicleId: "1750",
  garage: "Cabot",
  receivedAt: new Date(now.getTime() - 45 * 60 * 1000),
  direction: "Inbound",
  variant: "Mattapan - Ruggles",
  currentLocation: "Blue Hill Ave @ Warren St",
  operatorBadge: "52199",
  operatorName: "A. Jackson",
  runNumber: "R-028",
  respondedBy: "Dispatcher Smith",
  answeredAt: new Date(now.getTime() - 43 * 60 * 1000),
  markedDoneAt: new Date(now.getTime() - 38 * 60 * 1000),
  status: "done",
}

export const mockPastCall2: RttCall = {
  id: "rtt-past-002",
  callType: "PRTT",
  talkGroup: "TG-104",
  routeId: "77",
  routeName: "77",
  vehicleId: "1622",
  garage: "Charlestown",
  receivedAt: new Date(now.getTime() - 85 * 60 * 1000),
  direction: "Outbound",
  variant: "Arlington Heights - Harvard",
  currentLocation: "Massachusetts Ave @ Appleton St",
  operatorBadge: "49001",
  operatorName: "B. Nguyen",
  runNumber: "R-077",
  respondedBy: "Dispatcher Jones",
  answeredAt: new Date(now.getTime() - 83 * 60 * 1000),
  markedDoneAt: new Date(now.getTime() - 75 * 60 * 1000),
  status: "done",
}

export const mockPastCall3: RttCall = {
  id: "rtt-past-003",
  callType: "Emergency",
  talkGroup: "TG-101",
  routeId: "9",
  routeName: "9",
  vehicleId: "2201",
  garage: "Southampton",
  receivedAt: new Date(now.getTime() - 120 * 60 * 1000),
  direction: "Inbound",
  variant: "City Point - Copley via Broadway",
  currentLocation: "East Broadway @ L St",
  operatorBadge: "53210",
  operatorName: "D. Miller",
  runNumber: "R-009",
  respondedBy: "Dispatcher Smith",
  answeredAt: new Date(now.getTime() - 119 * 60 * 1000),
  markedDoneAt: new Date(now.getTime() - 105 * 60 * 1000),
  status: "done",
}

export const mockPastCalls: RttCall[] = [
  mockPastCall1,
  mockPastCall2,
  mockPastCall3,
]
