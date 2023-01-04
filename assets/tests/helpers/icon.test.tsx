import { render } from "@testing-library/react"
import React from "react"
import {
  alertIcon,
  blueLineIcon,
  busFrontIcon,
  busRearIcon,
  circleXIcon,
  closeXIcon,
  collapseIcon,
  commuterRailIcon,
  crowdingIcon,
  expandIcon,
  filledCircleIcon,
  greenLineBIcon,
  greenLineCIcon,
  greenLineDIcon,
  greenLineEIcon,
  greenLineIcon,
  ladderIcon,
  loadingIcon,
  mapIcon,
  mattapanLineIcon,
  minusIcon,
  notificationBellIcon,
  oldCloseIcon,
  orangeLineIcon,
  plusIcon,
  questionMarkIcon,
  redLineIcon,
  reverseIcon,
  searchIcon,
  triangleDownIcon,
  triangleUpIcon,
  upDownIcon,
  walkingIcon,
} from "../../src/helpers/icon"

describe.each([
  ["alertIcon", alertIcon],
  ["blueLineIcon", blueLineIcon],
  ["busFrontIcon", busFrontIcon],
  ["busRearIcon", busRearIcon],
  ["circleXIcon", circleXIcon],
  ["closeXIcon", closeXIcon],
  ["collapseIcon", collapseIcon],
  ["commuterRailIcon", commuterRailIcon],
  ["crowdingIcon", crowdingIcon],
  ["expandIcon", expandIcon],
  ["filledCircleIcon", filledCircleIcon],
  ["greenLineBIcon", greenLineBIcon],
  ["greenLineCIcon", greenLineCIcon],
  ["greenLineDIcon", greenLineDIcon],
  ["greenLineEIcon", greenLineEIcon],
  ["greenLineIcon", greenLineIcon],
  ["ladderIcon", ladderIcon],
  ["loadingIcon", loadingIcon],
  ["mapIcon", mapIcon],
  ["mattapanLineIcon", mattapanLineIcon],
  ["minusIcon", minusIcon],
  ["notificationBellIcon", notificationBellIcon],
  ["oldCloseIcon", oldCloseIcon],
  ["orangeLineIcon", orangeLineIcon],
  ["plusIcon", plusIcon],
  ["questionMarkIcon", questionMarkIcon],
  ["redLineIcon", redLineIcon],
  ["reverseIcon", reverseIcon],
  ["searchIcon", searchIcon],
  ["triangleDownIcon", triangleDownIcon],
  ["triangleUpIcon", triangleUpIcon],
  ["upDownIcon", upDownIcon],
  ["walkingIcon", walkingIcon],
])(`%s`, (_, iconFn) => {
  it("renders an icon with a class name", () => {
    const className = "test-class-name"

    /* eslint-disable react/no-danger */
    const expected = render(
      <span
        className={className}
        dangerouslySetInnerHTML={{
          __html: "<svg />",
        }}
      />
    ).asFragment()
    /* eslint-enable react/no-danger */

    const result = render(iconFn(className)).asFragment()

    expect(result).toEqual(expected)
  })

  it("renders without a class name", () => {
    /* eslint-disable react/no-danger */
    const expected = render(
      <span
        className=""
        dangerouslySetInnerHTML={{
          __html: "<svg/>",
        }}
      />
    ).asFragment()
    /* eslint-enable react/no-danger */

    const result = render(iconFn()).asFragment()

    expect(result).toEqual(expected)
  })
})
