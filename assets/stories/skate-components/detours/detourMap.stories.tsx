import type { Meta, StoryObj } from "@storybook/react"
import { route39shape } from "../__story-data__/shape"
import { DetourMap } from "../../../src/components/detours/detourMap"
import { ShapePoint } from "../../../src/schedule"

const shape = route39shape.points
const startPointIndex = 75
const startPoint: ShapePoint = shape[startPointIndex]
const waypoint = { lat: 42.33, lon: -71.1 }
const endPointIndex = 130
const endPoint: ShapePoint = shape[endPointIndex]

const meta = {
  component: DetourMap,
  parameters: {
    layout: "fullscreen",
    stretch: true,
  },
  args: {
    originalShape: shape,
    detourShape: [startPoint, waypoint, endPoint],
    startPoint,
    waypoints: [waypoint],
    endPoint,
    routeSegments: {
      beforeDetour: shape.slice(0, startPointIndex),
      detour: shape.slice(startPointIndex, endPointIndex),
      afterDetour: shape.slice(endPointIndex, -1),
    },
    onClickOriginalShape: () => {},
    onClickMap: () => {},
    undoDisabled: false,
    onUndo: () => {},
    onClear: () => {},
    zoom: 14,
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
    endPoint: undefined,
    routeSegments: undefined,
    detourShape: [startPoint, waypoint],
    waypoints: [waypoint],
    onClickMap: () => {},
  },
}

export const Unstarted: Story = {
  args: {
    startPoint: undefined,
    endPoint: undefined,
    routeSegments: undefined,
    detourShape: [],
    waypoints: [],
    undoDisabled: true,
  },
}
