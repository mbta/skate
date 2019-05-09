import detectSwipe from "../../src/helpers/detectSwipe"
import { touchEvent } from "../testHelpers/touchEventHelpers"

describe("detectSwipe", () => {
  test("returns a cleanup function for use in useEffect", () => {
    const mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    // @ts-ignore
    document.getElementById = () => mockElement

    const cleanupFunction = detectSwipe("test-id", () => void 0)

    expect(typeof cleanupFunction).toEqual("function")
  })

  test("adds event listeners for touch events", () => {
    const mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    // @ts-ignore
    document.getElementById = () => mockElement

    detectSwipe("test-id", () => void 0)

    expect(mockElement.addEventListener).toHaveBeenNthCalledWith(
      1,
      "touchstart",
      expect.any(Function)
    )
    expect(mockElement.addEventListener).toHaveBeenNthCalledWith(
      2,
      "touchmove",
      expect.any(Function)
    )
    expect(mockElement.addEventListener).toHaveBeenNthCalledWith(
      3,
      "touchend",
      expect.any(Function)
    )
  })

  test("the cleanup function removes the event listeners", () => {
    const mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    // @ts-ignore
    document.getElementById = () => mockElement

    const cleanupFunction = detectSwipe("test-id", () => void 0)
    cleanupFunction()

    expect(mockElement.removeEventListener).toHaveBeenNthCalledWith(
      1,
      "touchstart",
      expect.any(Function)
    )
    expect(mockElement.removeEventListener).toHaveBeenNthCalledWith(
      2,
      "touchmove",
      expect.any(Function)
    )
    expect(mockElement.removeEventListener).toHaveBeenNthCalledWith(
      3,
      "touchend",
      expect.any(Function)
    )
  })

  test("detects the direction of a swipe that is big enough", () => {
    const mockAddEventListener = jest
      .fn()
      .mockImplementationOnce((_eventName, touchStartCallback) =>
        touchStartCallback(touchEvent({ x: 0, y: 0 }))
      )
      .mockImplementationOnce((_eventName, touchMoveCallback) =>
        touchMoveCallback(touchEvent({ x: 50, y: 0 }))
      )
      .mockImplementationOnce((_eventName, touchEndCallback) =>
        touchEndCallback(touchEvent({ x: 50, y: 0 }))
      )
    const mockElement = {
      addEventListener: mockAddEventListener,
      removeEventListener: jest.fn(),
    }
    // @ts-ignore
    document.getElementById = () => mockElement
    const detectSwipeCallback = jest.fn()

    detectSwipe("test-id", detectSwipeCallback)

    expect(detectSwipeCallback).toHaveBeenCalledWith("Right")
  })

  test("does not call the callback if the swipe is not big enough", () => {
    const mockAddEventListener = jest
      .fn()
      .mockImplementationOnce((_eventName, touchStartCallback) =>
        touchStartCallback(touchEvent({ x: 0, y: 0 }))
      )
      .mockImplementationOnce((_eventName, touchMoveCallback) =>
        touchMoveCallback(touchEvent({ x: 20, y: 0 }))
      )
      .mockImplementationOnce((_eventName, touchEndCallback) =>
        touchEndCallback(touchEvent({ x: 20, y: 0 }))
      )
    const mockElement = {
      addEventListener: mockAddEventListener,
      removeEventListener: jest.fn(),
    }
    // @ts-ignore
    document.getElementById = () => mockElement
    const detectSwipeCallback = jest.fn()

    detectSwipe("test-id", detectSwipeCallback)

    expect(detectSwipeCallback).not.toHaveBeenCalled()
  })
})
