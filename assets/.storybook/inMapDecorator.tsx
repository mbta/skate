import { Decorator } from "@storybook/react"
import React from "react"

import Map from "../src/components/map"

// Render component within our base map component
export const inMapDecorator: Decorator = (StoryFn) => (
  <Map vehicles={[]}>
    <StoryFn />
  </Map>
)
