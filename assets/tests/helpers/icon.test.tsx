import React from "react"
import {
  blueLineIcon,
  busFrontIcon,
  busRearIcon,
  circleXIcon,
  closeIcon,
  collapseIcon,
  commuterRailIcon,
  expandIcon,
  filledCircleIcon,
  greenLineBIcon,
  greenLineCIcon,
  greenLineDIcon,
  greenLineEIcon,
  greenLineIcon,
  ladderIcon,
  mapIcon,
  mattapanLineIcon,
  minusIcon,
  orangeLineIcon,
  plusIcon,
  questionMarkIcon,
  redLineIcon,
  reverseIcon,
  searchIcon,
  triangleDownIcon,
  triangleUpIcon,
} from "../../src/helpers/icon"

const testMap: { [index: string]: (className?: string) => JSX.Element } = {
  blueLineIcon,
  busFrontIcon,
  busRearIcon,
  circleXIcon,
  closeIcon,
  collapseIcon,
  commuterRailIcon,
  expandIcon,
  filledCircleIcon,
  greenLineBIcon,
  greenLineCIcon,
  greenLineDIcon,
  greenLineEIcon,
  greenLineIcon,
  ladderIcon,
  mapIcon,
  mattapanLineIcon,
  minusIcon,
  orangeLineIcon,
  plusIcon,
  questionMarkIcon,
  redLineIcon,
  reverseIcon,
  searchIcon,
  triangleDownIcon,
  triangleUpIcon,
}

for (const key in testMap) {
  if (testMap.hasOwnProperty(key)) {
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
