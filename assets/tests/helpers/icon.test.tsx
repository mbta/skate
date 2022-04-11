import React from "react"
import {
  blueLineIcon,
  busFrontIcon,
  busRearIcon,
  circleXIcon,
  closeIcon,
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
  orangeLineIcon,
  plusIcon,
  questionMarkIcon,
  redLineIcon,
  reverseIcon,
  searchIcon,
  triangleDownIcon,
  triangleUpIcon,
  upDownIcon,
} from "../../src/helpers/icon"

const testMap: { [index: string]: (className?: string) => JSX.Element } = {
  blueLineIcon,
  busFrontIcon,
  busRearIcon,
  circleXIcon,
  closeIcon,
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
  orangeLineIcon,
  plusIcon,
  questionMarkIcon,
  redLineIcon,
  reverseIcon,
  searchIcon,
  triangleDownIcon,
  triangleUpIcon,
  upDownIcon,
}

for (const key in testMap) {
  if (Object.prototype.hasOwnProperty.call(testMap, key)) {
    const functionToTest = testMap[key]

    describe(key, () => {
      it("renders an icon with a class name", () => {
        const className = "test-class-name"

        const expected = (
          <span
            className={className}
            dangerouslySetInnerHTML={{
              __html: "SVG",
            }}
          />
        )

        const result = functionToTest(className)

        expect(result).toEqual(expected)
      })

      it("renders without a class name", () => {
        const expected = (
          <span
            className=""
            dangerouslySetInnerHTML={{
              __html: "SVG",
            }}
          />
        )

        const result = functionToTest()

        expect(result).toEqual(expected)
      })
    })
  }
}
