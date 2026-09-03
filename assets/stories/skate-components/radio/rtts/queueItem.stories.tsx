import type { Meta, StoryObj } from "@storybook/react-webpack5"
import { RttQueueItem } from "../../../../src/components/radio/rtts/queueItem"
import {
  mockEmergencyCall,
  mockPrttCall,
  mockActivePrttCallByOther,
  mockStandardRttCall1,
  mockPastCall1,
} from "./__story-data__/rttQueueData"

const meta = {
  component: RttQueueItem,
  parameters: {
    layout: "padded",
  },
  args: {
    call: mockStandardRttCall1,
    isSelected: false,
    tab: "incoming",
    onSelect: () => {},
    onRespond: () => {},
  },
} satisfies Meta<typeof RttQueueItem>

export default meta
type Story = StoryObj<typeof RttQueueItem>

export const StandardRTT: Story = {
  args: {
    call: mockStandardRttCall1,
  },
}

export const PriorityRTT: Story = {
  args: {
    call: mockPrttCall,
  },
}

export const Emergency: Story = {
  args: {
    call: mockEmergencyCall,
  },
}

export const Selected: Story = {
  args: {
    call: mockEmergencyCall,
    isSelected: true,
  },
}

export const RespondedByOtherDispatcher: Story = {
  args: {
    call: mockActivePrttCallByOther,
  },
}

export const PastTabRow: Story = {
  args: {
    call: mockPastCall1,
    tab: "past",
  },
}
