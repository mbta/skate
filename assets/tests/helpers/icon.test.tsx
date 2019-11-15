import React from "react"
import {
  blueLineIcon,
  closeIcon,
  commuterRailIcon,
  greenLineBIcon,
  greenLineCIcon,
  greenLineDIcon,
  greenLineEIcon,
  greenLineIcon,
  ladderIcon,
  mapIcon,
  mattapanLineIcon,
  orangeLineIcon,
  redLineIcon,
  reverseIcon,
} from "../../src/helpers/icon"

describe("blueLineIcon", () => {
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

    const result = blueLineIcon(className)

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

    const result = blueLineIcon()

    expect(result).toEqual(expected)
  })
})

describe("closeIcon", () => {
  it("renders", () => {
    const expected = (
      <span
        className=""
        dangerouslySetInnerHTML={{
          __html: "SVG",
        }}
      />
    )

    const result = closeIcon()

    expect(result).toEqual(expected)
  })
})

describe("commuterRailIcon", () => {
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

    const result = commuterRailIcon(className)

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

    const result = commuterRailIcon()

    expect(result).toEqual(expected)
  })
})

describe("greenLineBIcon", () => {
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

    const result = greenLineBIcon(className)

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

    const result = greenLineBIcon()

    expect(result).toEqual(expected)
  })
})

describe("greenLineCIcon", () => {
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

    const result = greenLineCIcon(className)

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

    const result = greenLineCIcon()

    expect(result).toEqual(expected)
  })
})

describe("greenLineDIcon", () => {
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

    const result = greenLineDIcon(className)

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

    const result = greenLineDIcon()

    expect(result).toEqual(expected)
  })
})

describe("greenLineEIcon", () => {
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

    const result = greenLineEIcon(className)

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

    const result = greenLineEIcon()

    expect(result).toEqual(expected)
  })
})

describe("greenLineIcon", () => {
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

    const result = greenLineIcon(className)

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

    const result = greenLineIcon()

    expect(result).toEqual(expected)
  })
})

describe("ladderIcon", () => {
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

    const result = ladderIcon(className)

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

    const result = ladderIcon()

    expect(result).toEqual(expected)
  })
})

describe("mapIcon", () => {
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

    const result = mapIcon(className)

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

    const result = mapIcon()

    expect(result).toEqual(expected)
  })
})

describe("mattapanLineIcon", () => {
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

    const result = mattapanLineIcon(className)

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

    const result = mattapanLineIcon()

    expect(result).toEqual(expected)
  })
})

describe("orangeLineIcon", () => {
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

    const result = orangeLineIcon(className)

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

    const result = orangeLineIcon()

    expect(result).toEqual(expected)
  })
})

describe("redLineIcon", () => {
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

    const result = redLineIcon(className)

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

    const result = redLineIcon()

    expect(result).toEqual(expected)
  })
})

describe("reverseIcon", () => {
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

    const result = reverseIcon(className)

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

    const result = reverseIcon()

    expect(result).toEqual(expected)
  })
})
