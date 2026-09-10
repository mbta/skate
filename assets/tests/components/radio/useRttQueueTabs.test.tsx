import { describe, test, expect } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useRttQueueTabs } from "../../../src/components/radio/rtts/useRttQueueTabs"

describe("useRttQueueTabs", () => {
  test("handleTabClick dispatches action and invokes onTabChange", () => {
    let dispatchedTab: string | null = null
    let callbackTab: string | null = null

    const { result } = renderHook(() =>
      useRttQueueTabs({
        tab: "incoming",
        newIncomingCount: 3,
        dispatchTabChange: (t) => {
          dispatchedTab = t
        },
        onTabChange: (t) => {
          callbackTab = t
        },
      })
    )

    expect(result.current.tab).toBe("incoming")
    expect(result.current.newIncomingCount).toBe(3)

    act(() => {
      result.current.handleTabClick("past")
    })

    expect(dispatchedTab).toBe("past")
    expect(callbackTab).toBe("past")
  })
})
