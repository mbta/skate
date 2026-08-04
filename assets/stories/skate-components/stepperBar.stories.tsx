import type { Meta, StoryObj } from "@storybook/react-webpack5"

import { StepperBar } from "../../src/components/stepperBar"

const meta = {
  component: StepperBar,
} satisfies Meta<typeof StepperBar>

export default meta
type Story = StoryObj<typeof StepperBar>

export const Default: Story = {
  args: { totalSteps: 3, currentStep: 1 },
}

export const Completed: Story = {
  args: { totalSteps: 3, currentStep: 3 },
}
