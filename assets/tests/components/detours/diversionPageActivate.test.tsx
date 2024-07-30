import React from "react"
import {
  DiversionPage as DiversionPageDefault,
  DiversionPageProps,
} from "../../../src/components/detours/diversionPage"
import { originalRouteFactory } from "../../factories/originalRouteFactory"
import { beforeEach, jest } from "@jest/globals"
import getTestGroups from "../../../src/userTestGroups"
import { TestGroups } from "../../../src/userInTestGroup"
import { render } from "@testing-library/react"
import {
  originalRouteShape,
  reviewDetourButton,
} from "../../testHelpers/selectors/components/detours/diversionPage"

const DiversionPage = (props: Partial<DiversionPageProps>) => {
  return (
    <DiversionPageDefault
      originalRoute={originalRouteFactory.build()}
      showConfirmCloseModal={false}
      {...props}
    />
  )
}

describe("DiversionPage activate workflow", () => {
  jest.mock("../../../src/userTestGroups")

  beforeEach(() => {
    jest
      .mocked(getTestGroups)
      .mockReturnValue([TestGroups.DetoursPilot, TestGroups.DetoursList])
  })

  test("has an activate button on the review details screen", () => {
    const { container } = render(<DiversionPage />)

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    act(() => {
      fireEvent.click(originalRouteShape.get(container))
    })

    await userEvent.click(reviewDetourButton.get())
  })
})
