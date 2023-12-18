import type { Meta, StoryObj } from "@storybook/react"

import { DiversionPanel } from "../../../src/components/detours/diversionPanel"
import React from "react"
import { ListGroup } from "react-bootstrap"

const meta = {
  component: DiversionPanel,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    routeName: "66",
    routeDescription: "Harvard via Allston",
    routeOrigin: "from Andrew Station",
    routeDirection: "Outbound",
  },
  argTypes: {
    // Since there's not a good way to expose JSX to the Storybook frontend yet:
    // Disable `ReactNode` args to reduce UI noise and prevent invalid parameters.
    directions: { table: { disable: true } },
    missedStops: { table: { disable: true } },
  },
} satisfies Meta<typeof DiversionPanel>
export default meta

type Story = StoryObj<typeof meta>

export const WithoutDirections: Story = {}

export const WithDirections: Story = {
  args: {
    directions: (
      <>
        <ListGroup variant="flush" as="ol">
          <ListGroup.Item as="li">Start at Centre St & John St</ListGroup.Item>
          <ListGroup.Item as="li">Right on John St</ListGroup.Item>
          <ListGroup.Item as="li">Left on Abbotsford Rd</ListGroup.Item>
          <ListGroup.Item as="li">Right on Boston St</ListGroup.Item>
          <ListGroup.Item as="li">
            <strong>Regular Route</strong>
          </ListGroup.Item>
        </ListGroup>
      </>
    ),
  },
}

export const WithStops: Story = {
  args: {
    ...WithDirections.args,
    missedStops: (
      <>
        <ListGroup variant="flush" as="ol">
          <ListGroup.Item as="li">Stop 1</ListGroup.Item>
          <ListGroup.Item as="li">Stop 2</ListGroup.Item>
          <ListGroup.Item as="li">Stop 3</ListGroup.Item>
          <ListGroup.Item as="li">Stop 4</ListGroup.Item>
        </ListGroup>
      </>
    ),
  },
}
