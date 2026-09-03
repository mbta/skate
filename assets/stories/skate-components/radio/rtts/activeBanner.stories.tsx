import type { Meta, StoryObj } from "@storybook/react-webpack5"
import { ActiveRttBanner } from "../../../../src/components/radio/rtts/activeBanner"
import {
  mockEmergencyCall,
  mockPrttCall,
  mockStandardRttCall1,
} from "./__story-data__/rttQueueData"

const meta = {
  component: ActiveRttBanner,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    activeCall: mockEmergencyCall,
    onMarkDone: () => {},
    onSelectActive: () => {},
  },
} satisfies Meta<typeof ActiveRttBanner>

export default meta
type Story = StoryObj<typeof ActiveRttBanner>

export const EmergencyActive: Story = {
  args: {
    activeCall: mockEmergencyCall,
  },
}

export const PrttActive: Story = {
  args: {
    activeCall: mockPrttCall,
  },
}

export const StandardRttActive: Story = {
  args: {
    activeCall: mockStandardRttCall1,
  },
}
