import { Decorator } from "@storybook/react-webpack5"
import React from "react"

import Map from "../src/components/map"

// Render component within our base map component
export const inMapDecorator: Decorator = (StoryFn) => (
  <Map vehicles={[]}>
    <StoryFn />
  </Map>
)
