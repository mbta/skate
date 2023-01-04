import { render } from "@testing-library/react"
import React from "react"
import {
  AlertIcon,
  BlueLineIcon,
  BusFrontIcon,
  BusRearIcon,
  CircleXIcon,
  CloseXIcon,
  CollapseIcon,
  CommuterRailIcon,
  CrowdingIcon,
  ExpandIcon,
  FilledCircleIcon,
  GreenLineBIcon,
  GreenLineCIcon,
  GreenLineDIcon,
  GreenLineEIcon,
  GreenLineIcon,
  LadderIcon,
  LoadingIcon,
  MapIcon,
  MattapanLineIcon,
  MinusIcon,
  NotificationBellIcon,
  OldCloseIcon,
  OrangeLineIcon,
  PlusIcon,
  QuestionMarkIcon,
  RedLineIcon,
  ReverseIcon,
  SearchIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  UpDownIcon,
  WalkingIcon,
} from "../../src/helpers/icon"

describe.each([
  ["AlertIcon", AlertIcon],
  ["BlueLineIcon", BlueLineIcon],
  ["BusFrontIcon", BusFrontIcon],
  ["BusRearIcon", BusRearIcon],
  ["CircleXIcon", CircleXIcon],
  ["CloseXIcon", CloseXIcon],
  ["CollapseIcon", CollapseIcon],
  ["CommuterRailIcon", CommuterRailIcon],
  ["CrowdingIcon", CrowdingIcon],
  ["ExpandIcon", ExpandIcon],
  ["FilledCircleIcon", FilledCircleIcon],
  ["GreenLineBIcon", GreenLineBIcon],
  ["GreenLineCIcon", GreenLineCIcon],
  ["GreenLineDIcon", GreenLineDIcon],
  ["GreenLineEIcon", GreenLineEIcon],
  ["GreenLineIcon", GreenLineIcon],
  ["LadderIcon", LadderIcon],
  ["LoadingIcon", LoadingIcon],
  ["MapIcon", MapIcon],
  ["MattapanLineIcon", MattapanLineIcon],
  ["MinusIcon", MinusIcon],
  ["NotificationBellIcon", NotificationBellIcon],
  ["OldCloseIcon", OldCloseIcon],
  ["OrangeLineIcon", OrangeLineIcon],
  ["PlusIcon", PlusIcon],
  ["QuestionMarkIcon", QuestionMarkIcon],
  ["RedLineIcon", RedLineIcon],
  ["ReverseIcon", ReverseIcon],
  ["SearchIcon", SearchIcon],
  ["TriangleDownIcon", TriangleDownIcon],
  ["TriangleUpIcon", TriangleUpIcon],
  ["UpDownIcon", UpDownIcon],
  ["WalkingIcon", WalkingIcon],
])(`%s`, (_, iconFn) => {
  it("renders an icon with a class name", () => {
    const className = "test-class-name"

    const result = render(iconFn({ className })).asFragment()

    expect(result).toEqual(
      render(
        <span className={className}>
          <svg />
        </span>
      ).asFragment()
    )
  })

  it("renders without a class name", () => {
    const result = render(iconFn({})).asFragment()

    expect(result).toEqual(
      render(
        <span>
          <svg />
        </span>
      ).asFragment()
    )
  })
})
