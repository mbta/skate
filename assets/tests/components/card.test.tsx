import React from "react"
import { render, screen } from "@testing-library/react"
import { Card, CardBody, CardProperties } from "../../src/components/card"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

describe("Card", () => {
  test("renders content", () => {
    render(
      <Card title="My Card" currentTime={new Date()} style="kiwi">
        Foo
      </Card>
    )

    expect(screen.getByText(/My Card/)).toBeVisible()
    expect(screen.getByText(/Foo/)).toBeVisible()
    expect(screen.queryByTitle("Close")).toBeNull()
    expect(screen.getByLabelText(/My Card/)).toHaveClass("c-card--inactive")
  })

  test("omits inactive class when active", () => {
    render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        isActive={true}
      >
        Foo
      </Card>
    )

    expect(screen.getByLabelText(/My Card/)).not.toHaveClass("c-card--inactive")
  })

  test("can add custom additional class", () => {
    render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        additionalClass="my-custom-class"
      >
        Foo
      </Card>
    )

    expect(screen.getByLabelText(/My Card/)).toHaveClass("my-custom-class")
  })

  test("can disable focus / hover states", () => {
    render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        noFocusOrHover={true}
      >
        Foo
      </Card>
    )

    expect(screen.getByLabelText(/My Card/)).toHaveClass(
      "c-card--no-focus-or-hover"
    )
  })

  test("can mark as selected", () => {
    render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        selected={true}
      >
        Foo
      </Card>
    )

    expect(
      screen.getByRole("generic", { name: "My Card", current: true })
    ).toBeInTheDocument()
  })

  test("includes age when time is given", () => {
    render(
      <Card
        title="My Card"
        currentTime={new Date("2022-07-01T10:00:00Z")}
        time={new Date("2022-07-01T10:10:00Z")}
        style="kiwi"
      >
        Foo
      </Card>
    )

    expect(screen.getByText(/10 min/)).toBeVisible()
  })

  test("includes icon element when given", () => {
    render(
      <Card title="My Card" icon={<>Bar</>} style="white">
        Foo
      </Card>
    )

    expect(screen.getByText(/Bar/)).toBeVisible()
  })

  test("includes icon element when given along with open callback", () => {
    render(
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

    expect(screen.getByText(/Bar/)).toBeVisible()
  })

  test("invokes callback when clicked", async () => {
    const openCallback = jest.fn()
    const user = userEvent.setup()
    render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        openCallback={openCallback}
      >
        Contents
      </Card>
    )

    await user.click(screen.getByRole("button", { name: /Contents/ }))

    expect(openCallback).toHaveBeenCalledTimes(1)
  })

  test("invokes callback on close", async () => {
    const closeCallback = jest.fn()
    const user = userEvent.setup()
    render(
      <Card
        title="My Card"
        currentTime={new Date()}
        style="kiwi"
        closeCallback={closeCallback}
      >
        Contents
      </Card>
    )

    await user.click(screen.getByRole("button", { name: /close/i }))

    expect(closeCallback).toHaveBeenCalledTimes(1)
  })
})

describe("CardBody", () => {
  test("renders content", () => {
    render(<CardBody>Foo</CardBody>)

    expect(screen.getByText("Foo")).toBeVisible()
  })
})

describe("CardProperties", () => {
  test("does render property that has a value", () => {
    render(
      <CardProperties
        properties={[
          {
            label: "My property",
            value: "Some value",
          },
        ]}
      />
    )

    expect(screen.getByRole("cell", { name: /My property/ })).toBeVisible()
    expect(screen.getByRole("cell", { name: /Some value/ })).toBeVisible()
  })

  test("doesn't render property that lacks a value", () => {
    render(
      <CardProperties
        properties={[
          {
            label: "My property",
            value: null,
          },
        ]}
      />
    )

    expect(screen.queryByRole("cell", { name: /My property/ })).toBeNull()
  })

  test("includes class for sensitive values", () => {
    render(
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
      screen.getByRole("row", { name: /Some sensitive value/ })
    ).toHaveClass("fs-mask")
  })
})
