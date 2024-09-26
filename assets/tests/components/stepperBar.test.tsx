import { describe, test, expect } from "@jest/globals"
import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"
import { StepperBar } from "../../src/components/stepperBar"

describe("StepperBar", () => {
  test("renders 1/3rd of the way", () => {
    const { baseElement } = render(
      <StepperBar totalSteps={3} currentStep={1} />
    )

    expect(baseElement).toMatchSnapshot()
  })

  test("renders when stepper bar is complete", () => {
    const { baseElement } = render(
      <StepperBar totalSteps={3} currentStep={1} />
    )

    expect(baseElement).toMatchSnapshot()
  })
})
