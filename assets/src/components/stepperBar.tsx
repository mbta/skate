import useComponentSize from "@rehooks/component-size"
import React, { useRef } from "react"
import { SvgProps } from "../helpers/bsIcons"

export const StepperBar = ({
  totalSteps,
  currentStep,
}: {
  totalSteps: number
  currentStep: number
}) => {
  const stepperRef = useRef(null)
  const { width } = useComponentSize(stepperRef)

  const stepWidth = width / totalSteps

  let stepper
  if (currentStep == totalSteps) {
    stepper = <FilledStepper stepWidth={stepWidth} stepCount={currentStep} />
  } else {
    stepper = (
      <>
        <FilledStepper
          stepWidth={stepWidth}
          stepCount={currentStep}
          isPartial={true}
        />
        <UnfilledStepper
          stepWidth={stepWidth}
          stepCount={totalSteps - currentStep}
        />
      </>
    )
  }

  return (
    <div className="c-stepper-bar d-grid" ref={stepperRef}>
      <StepperBusIcon style={{ marginLeft: stepWidth * currentStep - 66 }} />
      <div className="d-flex">{stepper}</div>
    </div>
  )
}

const barHeight = 8
const grayFill = "#D4D7DB"
const purpleFill = "#6D39AC"

const FilledStepper = ({
  stepWidth: stepWidth,
  stepCount: stepCount,
  isPartial: isPartial,
}: {
  stepWidth: number
  stepCount: number
  isPartial?: boolean
}) => (
  <svg width={stepWidth * stepCount} height={barHeight}>
    {isPartial && (
      <rect
        width={stepWidth * stepCount}
        height={barHeight}
        x={barHeight}
        fill={grayFill}
      />
    )}
    <rect
      width={stepWidth * stepCount}
      height={barHeight}
      rx={barHeight / 2}
      ry={barHeight / 2}
      fill={purpleFill}
    />
    <StopDots stepWidth={stepWidth} numDots={stepCount} />
  </svg>
)

const UnfilledStepper = ({
  stepWidth: stepWidth,
  stepCount: stepCount,
}: {
  stepWidth: number
  stepCount: number
}) => (
  <svg width={stepWidth * stepCount} height={barHeight}>
    <rect width={barHeight} height={barHeight} fill={grayFill} />
    <rect
      width={stepWidth * stepCount}
      height={barHeight}
      rx={barHeight / 2}
      ry={barHeight / 2}
      fill={grayFill}
    />
    <StopDots stepWidth={stepWidth} numDots={stepCount} />
  </svg>
)

const StopDots = ({
  stepWidth: stepWidth,
  numDots: numDots,
}: {
  stepWidth: number
  numDots: number
}) => {
  let dots = []
  for (let i = 1; i < numDots + 1; i++) {
    dots.push(
      <ellipse
        key={`stop-dot-${i}`}
        rx={barHeight / 4}
        ry={barHeight / 4}
        cx={stepWidth * i - barHeight * 0.75}
        cy={barHeight / 2}
        fill="white"
      />
    )
  }

  return <>{dots}</>
}

const StepperBusIcon = (props: SvgProps) => (
  <svg
    width="66"
    height="20"
    viewBox="0 0 66 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M64.5 16.0624H8.5L1 14.5625C1 5.3625 1.33333 2.72902 1.5 2.56228H3C3.27614 2.56228 3.4973 2.33744 3.51288 2.06174C3.57569 0.949877 3.85283 0.915105 4 1.06228H56L58.3212 1.99089C58.4393 2.03815 58.5654 2.06244 58.6926 2.06244H61C64.6222 2.06244 64.8333 11.5624 64.5 16.0624Z"
      fill="white"
      stroke="black"
      strokeWidth="2"
    />
    <circle
      cx="17"
      cy="15.5625"
      r="2.5"
      fill="white"
      stroke="black"
      strokeWidth="2"
    />
    <circle
      cx="55"
      cy="15.5625"
      r="2.5"
      fill="white"
      stroke="black"
      strokeWidth="2"
    />
    <mask id="path-4-inside-1_3975_16368" fill="white">
      <path d="M8 5.9375C8 5.38522 8.44772 4.9375 9 4.9375H22C22.5523 4.9375 23 5.38522 23 5.9375V8.9375C23 9.48978 22.5523 9.9375 22 9.9375H12C9.79086 9.9375 8 8.14664 8 5.9375Z" />
    </mask>
    <path
      d="M8 5.9375C8 5.38522 8.44772 4.9375 9 4.9375H22C22.5523 4.9375 23 5.38522 23 5.9375V8.9375C23 9.48978 22.5523 9.9375 22 9.9375H12C9.79086 9.9375 8 8.14664 8 5.9375Z"
      fill="white"
      stroke="black"
      strokeWidth="4"
      mask="url(#path-4-inside-1_3975_16368)"
    />
    <mask id="path-5-inside-2_3975_16368" fill="white">
      <rect x="25" y="4.9375" width="30" height="6" rx="1" />
    </mask>
    <rect
      x="25"
      y="4.9375"
      width="30"
      height="6"
      rx="1"
      fill="white"
      stroke="black"
      strokeWidth="4"
      mask="url(#path-5-inside-2_3975_16368)"
    />
    <mask id="path-6-inside-3_3975_16368" fill="white">
      <path d="M56.5 6.0625C56.5 5.51022 56.9477 5.0625 57.5 5.0625H59.5C60.6046 5.0625 61.5 5.95793 61.5 7.0625V9.0625C61.5 9.61478 61.0523 10.0625 60.5 10.0625H57.5C56.9477 10.0625 56.5 9.61478 56.5 9.0625V6.0625Z" />
    </mask>
    <path
      d="M56.5 6.0625C56.5 5.51022 56.9477 5.0625 57.5 5.0625H59.5C60.6046 5.0625 61.5 5.95793 61.5 7.0625V9.0625C61.5 9.61478 61.0523 10.0625 60.5 10.0625H57.5C56.9477 10.0625 56.5 9.61478 56.5 9.0625V6.0625Z"
      fill="white"
      stroke="black"
      strokeWidth="4"
      mask="url(#path-6-inside-3_3975_16368)"
    />
  </svg>
)
