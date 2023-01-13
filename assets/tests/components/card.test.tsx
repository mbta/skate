import React from "react"
import { render } from "@testing-library/react"
import { Card, CardBody, CardProperties } from "../../src/components/card"
import userEvent from "@testing-library/user-event"

describe("Card", () => {
  test("renders content", () => {
    const result = render(
      <Card title="My Card" currentTime={new Date()} style="kiwi">
        Foo
      </Card>
    )

    expect(result.queryByText(/My Card/)).not.toBeNull()
    expect(result.queryByText(/Foo/)).not.toBeNull()
    expect(result.queryByTitle("Close")).toBeNull()
    expect(
      result.queryByText(/Foo/)?.parentElement?.parentElement?.parentElement
        ?.className
    ).toMatch(/m-card--read/)
  })

  test("omits read class when unread", () => {
    const result = render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        isUnread={true}
      >
        Foo
      </Card>
    )

    expect(
      result.queryByText(/Foo/)?.parentElement?.parentElement?.className
    ).not.toMatch(/m-card--read/)
  })

  test("can add custom additional class", () => {
    const result = render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        additionalClass="my-custom-class"
      >
        Foo
      </Card>
    )

    expect(
      result.queryByText(/Foo/)?.parentElement?.parentElement?.parentElement
        ?.className
    ).toMatch(/my-custom-class/)
  })

  test("can disable focus / hover states", () => {
    const result = render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        noFocusOrHover={true}
      >
        Foo
      </Card>
    )

    expect(
      result.queryByText(/Foo/)?.parentElement?.parentElement?.parentElement
        ?.className
    ).toMatch(/m-card--no-focus-or-hover/)
  })

  test("includes age when time is given", () => {
    const result = render(
      <Card
        title="My Card"
        currentTime={new Date("2022-07-01T10:00:00Z")}
        time={new Date("2022-07-01T10:10:00Z")}
        style="kiwi"
      >
        Foo
      </Card>
    )

    expect(result.queryByText(/10 min/)).not.toBeNull()
  })

  test("includes icon element when given", () => {
    const result = render(
      <Card title="My Card" icon={<>Bar</>} style="white">
        Foo
      </Card>
    )

    expect(result.queryByText(/Bar/)).not.toBeNull()
  })

  test("includes icon element when given along with open callback", () => {
    const result = render(
      <Card
        title="My Card"
        icon={<>Bar</>}
        style="white"
        openCallback={() => {
          null
        }}
      >
        Foo
      </Card>
    )

    expect(result.queryByText(/Bar/)).not.toBeNull()
  })

  test("invokes callback when clicked", async () => {
    const openCallback = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        openCallback={openCallback}
      >
        Contents
      </Card>
    )

    expect(
      result.getByText(/Contents/).parentElement?.parentElement?.tagName
    ).toEqual("BUTTON")

    await user.click(result.getByText(/Contents/))

    expect(openCallback).toHaveBeenCalledTimes(1)
  })

  test("invokes callback on close", async () => {
    const closeCallback = jest.fn()
    const user = userEvent.setup()
    const result = render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        closeCallback={closeCallback}
      >
        Contents
      </Card>
    )

    await user.click(result.getByRole("button", { name: /close/i }))

    expect(closeCallback).toHaveBeenCalledTimes(1)
  })
})

describe("CardBody", () => {
  test("renders content", () => {
    const result = render(<CardBody>Foo</CardBody>)

    expect(result.queryByText("Foo")).not.toBeNull()
  })
})

describe("CardProperties", () => {
  test("does render property that has a value", () => {
    const result = render(
      <CardProperties
        properties={[
          {
            label: "My property",
            value: "Some value",
          },
        ]}
      />
    )

    expect(result.queryByText(/My property/)).not.toBeNull()
    expect(result.queryByText(/Some value/)).not.toBeNull()
  })

  test("doesn't render property that lacks a value", () => {
    const result = render(
      <CardProperties
        properties={[
          {
            label: "My property",
            value: null,
          },
        ]}
      />
    )

    expect(result.queryByText(/My property/)).toBeNull()
  })

  test("includes class for sensitive values", () => {
    const result = render(
      <CardProperties
        properties={[
          {
            label: "My property",
            value: "Some sensitive value",
            sensitive: true,
          },
        ]}
      />
    )

    expect(
      result.queryByText(/Some sensitive value/)?.parentElement?.className
    ).toMatch(/fs-mask/)
  })
})
