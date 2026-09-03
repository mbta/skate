import type { Meta, StoryObj } from "@storybook/react-webpack5"
import { RttDetailsPanel } from "../../../../src/components/radio/rtts/detailsPanel"
import {
  mockEmergencyCall,
  mockPrttCall,
  mockStandardRttCall1,
  mockPastCall1,
} from "./__story-data__/rttQueueData"

const meta = {
  component: RttDetailsPanel,
  parameters: {
    layout: "padded",
  },
  args: {
    call: mockEmergencyCall,
    isLive: false,
    onMarkDone: () => {},
  },
} satisfies Meta<typeof RttDetailsPanel>

export default meta
type Story = StoryObj<typeof RttDetailsPanel>

export const UnassignedInspection: Story = {
  args: {
    call: mockEmergencyCall,
    isLive: false,
  },
}

export const LiveActiveCall: Story = {
  args: {
    call: {
      ...mockEmergencyCall,
      status: "active",
      respondedBy: "Dispatcher Smith",
      answeredAt: new Date(),
    },
    isLive: true,
  },
}

export const StandardRttDetails: Story = {
  args: {
    call: mockStandardRttCall1,
    isLive: false,
  },
}

export const PriorityRttDetails: Story = {
  args: {
    call: mockPrttCall,
    isLive: false,
  },
}

export const CompletedPastCall: Story = {
  args: {
    call: mockPastCall1,
    isLive: false,
  },
}

export const EmptyState: Story = {
  args: {
    call: null,
  },
}
