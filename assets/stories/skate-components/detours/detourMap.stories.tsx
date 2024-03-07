import type { Meta, StoryObj } from "@storybook/react"
import { route39shape } from "../__story-data__/shape"
import { DetourMap } from "../../../src/components/detours/detourMap"
import { ShapePoint } from "../../../src/schedule"
import { LocationType, RouteType } from "../../../src/models/stopData"

const shape = route39shape.points
const startPointIndex = 75
const startPoint: ShapePoint = shape[startPointIndex]
const waypoint = { lat: 42.33, lon: -71.1 }
const endPointIndex = 130
const endPoint: ShapePoint = shape[endPointIndex]

const stopsBefore = [
  {
    id: "1",
    name: "Huntington @ Main Blvd",
    locationType: LocationType.Stop,
    vehicleType: RouteType.Bus,
    ...shape[65],
  },
  {
    id: "2",
    name: "Huntington @ First Ave",
    locationType: LocationType.Stop,
    vehicleType: RouteType.Bus,
    ...shape[72],
  },
]

const missedStops = [
  {
    id: "3",
    name: "Huntington @ Coddingsworth",
    locationType: LocationType.Stop,
    vehicleType: RouteType.Bus,
    ...shape[90],
  },
  {
    id: "4",
    name: "Huntington @ Huntington",
    locationType: LocationType.Stop,
    vehicleType: RouteType.Bus,
    routes: [{ type: 0, id: "66", name: "66" }],
    ...shape[110],
  },
  {
    id: "5",
    name: "Back of the Hills",
    locationType: LocationType.Stop,
    vehicleType: RouteType.Bus,
    ...shape[120],
  },
]

const stopsAfter = [
  {
    id: "6",
    name: "Huntington @ Heath",
    locationType: LocationType.Stop,
    vehicleType: RouteType.Bus,
    ...shape[135],
  },
  {
    id: "7",
    name: "Huntington @ Centre",
    locationType: LocationType.Stop,
    vehicleType: RouteType.Bus,
    ...shape[150],
  },
]

const allStops = [...stopsBefore, ...missedStops, ...stopsAfter]
const visitedStops = [...stopsBefore, ...stopsAfter]

const meta = {
  component: DetourMap,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    originalShape: shape,
    detourShape: [startPoint, waypoint, endPoint],
    stops: visitedStops,
    startPoint,
    waypoints: [waypoint],
    endPoint,
    routeSegments: {
      beforeDetour: shape.slice(0, startPointIndex),
      detour: shape.slice(startPointIndex, endPointIndex),
      afterDetour: shape.slice(endPointIndex, -1),
    },
    onClickOriginalShape: () => {},
    onClickMap: undefined,
    undoDisabled: false,
    onUndo: () => {},
    onClear: () => {},
    zoom: 15,
    center: { lat: 42.33, lng: -71.11 },
  },
  argTypes: {
    startPoint: { table: { disable: true } },
    endPoint: { table: { disable: true } },
    routeSegments: { table: { disable: true } },
    originalShape: { table: { disable: true } },
    detourShape: { table: { disable: true } },
    waypoints: { table: { disable: true } },
    onClickOriginalShape: { table: { disable: true } },
    onClickMap: { table: { disable: true } },
    undoDisabled: { table: { disable: true } },
    onUndo: { table: { disable: true } },
    onClear: { table: { disable: true } },
    zoom: { table: { disable: true } },
    center: { table: { disable: true } },
  },
} satisfies Meta<typeof DetourMap>
export default meta

type Story = StoryObj<typeof meta>

export const Connected: Story = {}

export const WithSomeWaypoints: Story = {
  args: {
    stops: allStops,
    endPoint: undefined,
    routeSegments: undefined,
    detourShape: [startPoint, waypoint],
    waypoints: [waypoint],
    onClickMap: () => {},
  },
}

export const Unstarted: Story = {
  args: {
    stops: allStops,
    startPoint: undefined,
    endPoint: undefined,
    routeSegments: undefined,
    detourShape: [],
    waypoints: [],
    undoDisabled: true,
  },
}
