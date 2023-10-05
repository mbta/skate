import { jest, describe, test, expect } from "@jest/globals"
import { act, renderHook } from "@testing-library/react"
import { string, unknown } from "superstruct"
import {
  useChannel,
  useCheckedChannel,
  useCheckedTwoWayChannel,
} from "../../src/hooks/useChannel"
import * as browser from "../../src/models/browser"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"
import * as Sentry from "@sentry/react"
import { PushStatus } from "phoenix"

jest.mock("@sentry/react", () => ({
  __esModule: true,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

describe("useChannel", () => {
  test("returns loadingState initially", () => {
    const { result } = renderHook(() =>
      useChannel({
        socket: undefined,
        topic: "topic",
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )
    expect(result.current).toEqual("loading")
  })

  test("if given no topic, doesn't open a channel and returns loadingState", () => {
    const mockSocket = makeMockSocket()
    const { result } = renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: null,
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )
    expect(result.current).toEqual("loading")
    expect(mockSocket.channel).not.toHaveBeenCalled()
  })

  test("subscribes to the given topic", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("topic")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("returns loadingState while loading", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )
    expect(result.current).toEqual("loading")
  })

  test("returns data from the initial join", () => {
    const parser = jest.fn(() => "parsed")
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: "raw" })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser,
        loadingState: "loading",
      })
    )

    expect(parser).toHaveBeenCalledWith("raw")
    expect(result.current).toEqual("parsed")
  })

  test("returns data pushed to the channel", async () => {
    const parser = jest.fn(() => "parsed")
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "event") {
        handler({
          data: "raw",
        })
      }
      return 1
    })

    const { result } = renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser,
        loadingState: "loading",
      })
    )

    expect(parser).toHaveBeenCalledWith("raw")
    expect(result.current).toEqual("parsed")
  })

  test("reloads on auth_expired event", () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "auth_expired") {
        handler()
      }
      return 1
    })

    renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  test("leaves the channel on unmount", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { unmount } = renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(mockChannel.join).toHaveBeenCalled()

    unmount()

    expect(mockChannel.leave).toHaveBeenCalled()
  })

  test("leaves the channel, removes old data, and joins new channel when the topic changes", () => {
    const mockSocket = makeMockSocket()
    const channel1 = makeMockChannel("ok", { data: "raw" })
    const channel2 = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => channel1)
    mockSocket.channel.mockImplementationOnce(() => channel2)

    const parser = jest.fn(() => "parsed")
    const { rerender, result } = renderHook(
      (topic) =>
        useChannel({
          socket: mockSocket,
          topic,
          event: "event",
          parser,
          loadingState: "loading",
        }),
      { initialProps: "topic1" }
    )

    expect(result.current).toEqual("parsed")
    rerender("topic2")

    expect(channel1.leave).toHaveBeenCalled()
    expect(result.current).toEqual("loading")
    expect(channel2.join).toHaveBeenCalled()
  })

  test("leaves the channel, removes old data, and joins new channel when the parser changes", () => {
    const mockSocket = makeMockSocket()
    const channel1 = makeMockChannel("ok", { data: "raw" })
    const channel2 = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => channel1)
    mockSocket.channel.mockImplementationOnce(() => channel2)

    const { rerender, result } = renderHook(
      (parser: (data: any) => string) =>
        useChannel({
          socket: mockSocket,
          topic: "topic",
          event: "event",
          parser,
          loadingState: "loading",
        }),
      { initialProps: jest.fn(() => "parsed") }
    )

    expect(result.current).toEqual("parsed")
    rerender(jest.fn(() => "parsed2"))

    expect(channel1.leave).toHaveBeenCalled()
    expect(result.current).toEqual("loading")
    expect(channel2.join).toHaveBeenCalled()
  })

  test("leaves the channel, removes old data, and joins new channel when closeAfterFirstRead changes", () => {
    const mockSocket = makeMockSocket()
    const channel1 = makeMockChannel("ok", { data: "raw" })
    const channel2 = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => channel1)
    mockSocket.channel.mockImplementationOnce(() => channel2)

    const parser = jest.fn(() => "parsed")
    const { rerender, result } = renderHook(
      (closeAfterFirstRead: boolean) =>
        useChannel({
          socket: mockSocket,
          topic: "topic",
          event: "event",
          parser,
          loadingState: "loading",
          closeAfterFirstRead,
        }),
      { initialProps: false }
    )

    expect(result.current).toEqual("parsed")
    rerender(true)

    expect(channel1.leave).toHaveBeenCalled()
    expect(result.current).toEqual("loading")
    expect(channel2.join).toHaveBeenCalled()
  })

  test("leaves the channel and removes old data when topic is changed to null", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: "raw" })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const parser = jest.fn(() => "parsed")
    const { rerender, result } = renderHook<string | null, any>(
      (topic) =>
        useChannel({
          socket: mockSocket,
          topic,
          event: "event",
          parser,
          loadingState: "loading",
        }),
      { initialProps: "topic" }
    )

    expect(result.current).toEqual("parsed")
    rerender(null)

    expect(mockChannel.leave).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual("loading")
  })

  test("console.error on join error", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce((msg) => msg)
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(spyConsoleError).toHaveBeenCalled()
    spyConsoleError.mockRestore()
  })

  test("reloads on join error due to not being authenticated", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error", {
      reason: "not_authenticated",
    })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  test("returns data from the initial join with closeAfterFirstRead, leaves", () => {
    const parser = jest.fn(() => "parsed")
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: "raw" })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    const { result } = renderHook(() =>
      useChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        parser,
        loadingState: "loading",
        closeAfterFirstRead: true,
      })
    )

    expect(parser).toHaveBeenCalledWith("raw")
    expect(result.current).toEqual("parsed")
    expect(mockChannel.leave).toHaveBeenCalled()
  })
})

describe("useCheckedChannel", () => {
  test("returns loadingState initially", () => {
    const dataStruct = unknown()
    const { result } = renderHook(() =>
      useCheckedChannel({
        socket: undefined,
        topic: "topic",
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )
    expect(result.current).toEqual("loading")
  })
  test("if given no topic, doesn't open a channel and returns loadingState", () => {
    const mockSocket = makeMockSocket()
    const dataStruct = unknown()
    const { result } = renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: null,
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )
    expect(result.current).toEqual("loading")
    expect(mockSocket.channel).not.toHaveBeenCalled()
  })

  test("subscribes to the given topic", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    const dataStruct = unknown()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)

    renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(mockSocket.channel).toHaveBeenCalledTimes(1)
    expect(mockSocket.channel).toHaveBeenCalledWith("topic")
    expect(mockChannel.join).toHaveBeenCalledTimes(1)
  })

  test("returns loadingState while loading", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = unknown()

    const { result } = renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )
    expect(result.current).toEqual("loading")
  })

  test("returns data from the initial join", () => {
    const parser = jest.fn(() => "parsed")
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: "raw" })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = string()

    const { result } = renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser,
        loadingState: "loading",
      })
    )

    expect(parser).toHaveBeenCalledWith("raw")
    expect(result.current).toEqual("parsed")
  })

  test("handles malformed data from the initial join", () => {
    const parser = jest.fn(() => "parsed")
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: 12 })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = string()

    renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser,
        loadingState: "loading",
      })
    )

    expect(Sentry.captureException).toHaveBeenCalled()
  })

  test("returns data pushed to the channel", async () => {
    const parser = jest.fn(() => "parsed")
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "event") {
        handler({
          data: "raw",
        })
      }
      return 1
    })
    const dataStruct = string()

    const { result } = renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser,
        loadingState: "loading",
      })
    )

    expect(parser).toHaveBeenCalledWith("raw")
    expect(result.current).toEqual("parsed")
  })

  test("handles malformed data pushed to the channel", async () => {
    const parser = jest.fn(() => "parsed")
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "event") {
        handler({
          data: 12,
        })
      }
      return 1
    })
    const dataStruct = string()

    renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser,
        loadingState: "loading",
      })
    )

    expect(Sentry.captureException).toHaveBeenCalled()
  })

  test("reloads on auth_expired event", () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    mockChannel.on.mockImplementation((event, handler) => {
      if (event === "auth_expired") {
        handler()
      }
      return 1
    })
    const dataStruct = unknown()

    renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  test("leaves the channel on unmount", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = unknown()

    const { unmount } = renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(mockChannel.join).toHaveBeenCalled()

    unmount()

    expect(mockChannel.leave).toHaveBeenCalled()
  })

  test("leaves the channel, removes old data, and joins new channel when the topic changes", () => {
    const mockSocket = makeMockSocket()
    const channel1 = makeMockChannel("ok", { data: "raw" })
    const channel2 = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => channel1)
    mockSocket.channel.mockImplementationOnce(() => channel2)
    const dataStruct = string()

    const parser = jest.fn(() => "parsed")
    const { rerender, result } = renderHook(
      (topic) =>
        useCheckedChannel({
          socket: mockSocket,
          topic,
          event: "event",
          dataStruct,
          parser,
          loadingState: "loading",
        }),
      { initialProps: "topic1" }
    )

    expect(result.current).toEqual("parsed")
    rerender("topic2")

    expect(channel1.leave).toHaveBeenCalled()
    expect(result.current).toEqual("loading")
    expect(channel2.join).toHaveBeenCalled()
  })

  test("leaves the channel, removes old data, and joins new channel when the parser changes", () => {
    const mockSocket = makeMockSocket()
    const channel1 = makeMockChannel("ok", { data: "raw" })
    const channel2 = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => channel1)
    mockSocket.channel.mockImplementationOnce(() => channel2)
    const dataStruct = string()

    const { rerender, result } = renderHook(
      (parser: (data: any) => string) =>
        useCheckedChannel({
          socket: mockSocket,
          topic: "topic",
          event: "event",
          dataStruct,
          parser,
          loadingState: "loading",
        }),
      { initialProps: jest.fn(() => "parsed") }
    )

    expect(result.current).toEqual("parsed")
    rerender(jest.fn(() => "parsed2"))

    expect(channel1.leave).toHaveBeenCalled()
    expect(result.current).toEqual("loading")
    expect(channel2.join).toHaveBeenCalled()
  })

  test("leaves the channel, removes old data, and joins new channel when closeAfterFirstRead changes", () => {
    const mockSocket = makeMockSocket()
    const channel1 = makeMockChannel("ok", { data: "raw" })
    const channel2 = makeMockChannel()
    mockSocket.channel.mockImplementationOnce(() => channel1)
    mockSocket.channel.mockImplementationOnce(() => channel2)
    const dataStruct = string()

    const parser = jest.fn(() => "parsed")
    const { rerender, result } = renderHook(
      (closeAfterFirstRead: boolean) =>
        useCheckedChannel({
          socket: mockSocket,
          topic: "topic",
          event: "event",
          dataStruct,
          parser,
          loadingState: "loading",
          closeAfterFirstRead,
        }),
      { initialProps: false }
    )

    expect(result.current).toEqual("parsed")
    rerender(true)

    expect(channel1.leave).toHaveBeenCalled()
    expect(result.current).toEqual("loading")
    expect(channel2.join).toHaveBeenCalled()
  })

  test("leaves the channel and removes old data when topic is changed to null", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: "raw" })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = string()

    const parser = jest.fn(() => "parsed")
    const { rerender, result } = renderHook<string | null, any>(
      (topic) =>
        useCheckedChannel({
          socket: mockSocket,
          topic,
          event: "event",
          dataStruct,
          parser,
          loadingState: "loading",
        }),
      { initialProps: "topic" }
    )

    expect(result.current).toEqual("parsed")
    rerender(null)

    expect(mockChannel.leave).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual("loading")
  })

  test("console.error on join error", async () => {
    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce((msg) => msg)
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = unknown()

    renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(spyConsoleError).toHaveBeenCalled()
    spyConsoleError.mockRestore()
  })

  test("reloads on join error due to not being authenticated", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("error", {
      reason: "not_authenticated",
    })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = unknown()

    renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  test("reloads the window on channel timeout", async () => {
    const reloadSpy = jest.spyOn(browser, "reload")
    reloadSpy.mockImplementationOnce(() => ({}))
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("timeout")
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = unknown()

    renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser: jest.fn(),
        loadingState: "loading",
      })
    )

    expect(reloadSpy).toHaveBeenCalled()
    reloadSpy.mockRestore()
  })

  test("returns data from the initial join with closeAfterFirstRead, leaves", () => {
    const parser = jest.fn(() => "parsed")
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel("ok", { data: "raw" })
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = string()

    const { result } = renderHook(() =>
      useCheckedChannel({
        socket: mockSocket,
        topic: "topic",
        event: "event",
        dataStruct,
        parser,
        loadingState: "loading",
        closeAfterFirstRead: true,
      })
    )

    expect(parser).toHaveBeenCalledWith("raw")
    expect(result.current).toEqual("parsed")
    expect(mockChannel.leave).toHaveBeenCalled()
  })
})

describe("useCheckedTwoWayChannel", () => {
  test("when a pushed message receives a parsable result, the result is returned", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel(
      "ok",
      jest
        .fn()
        .mockReturnValueOnce({ data: "raw" })
        .mockReturnValueOnce({ data: "push_success" })
    )
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = string()

    const parser = jest.fn((data) => "parsed " + data)
    const { result } = renderHook<
      [string | null, (event: string, payload: unknown) => void],
      any
    >(
      (topic) =>
        useCheckedTwoWayChannel({
          socket: mockSocket,
          topic,
          event: "event",
          dataStruct,
          parser,
          loadingState: "loading",
        }),
      { initialProps: "topic" }
    )

    const [state, pushFn] = result.current

    expect(state).toEqual("parsed raw")
    act(() => {
      pushFn("hello", "pushed")
    })

    expect(mockChannel.push).toHaveBeenCalledWith("hello", "pushed")

    const [updatedState] = result.current

    expect(updatedState).toEqual("parsed push_success")
  })

  test("when a pushed message receives a result that isn't parsable, the last result is still returned", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel(
      "ok",
      jest
        .fn()
        .mockReturnValueOnce({ data: "raw" })
        .mockReturnValueOnce("poorly_formatted")
    )
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = string()

    const parser = jest.fn((data) => "parsed " + data)
    const { result } = renderHook<
      [string | null, (event: string, payload: unknown) => void],
      any
    >(
      (topic) =>
        useCheckedTwoWayChannel({
          socket: mockSocket,
          topic,
          event: "event",
          dataStruct,
          parser,
          loadingState: "loading",
        }),
      { initialProps: "topic" }
    )

    const [state, pushFn] = result.current

    expect(state).toEqual("parsed raw")
    act(() => {
      pushFn("hello", "pushed")
    })

    expect(mockChannel.push).toHaveBeenCalledWith("hello", "pushed")
    expect(Sentry.captureException).toHaveBeenCalled()

    const [updatedState] = result.current

    expect(updatedState).toEqual("parsed raw")
  })

  test("when receives an error on message push, logs to sentry", () => {
    const mockSocket = makeMockSocket()
    const mockChannel = makeMockChannel(
      jest
        .fn<() => PushStatus>()
        // Return OK while joining, then error on push
        .mockReturnValueOnce("ok")
        .mockReturnValueOnce("ok")
        .mockReturnValueOnce("ok")
        .mockReturnValueOnce("error")
        .mockReturnValueOnce("error"),
      jest
        .fn()
        .mockReturnValueOnce({ data: "raw" })
        .mockReturnValueOnce({ data: "welformatted, but error" })
    )
    mockSocket.channel.mockImplementationOnce(() => mockChannel)
    const dataStruct = string()

    const parser = jest.fn((data) => "parsed " + data)
    const { result } = renderHook<
      [string | null, (event: string, payload: unknown) => void],
      any
    >(
      (topic) =>
        useCheckedTwoWayChannel({
          socket: mockSocket,
          topic,
          event: "event",
          dataStruct,
          parser,
          loadingState: "loading",
        }),
      { initialProps: "topic" }
    )

    const [state, pushFn] = result.current

    expect(state).toEqual("parsed raw")
    act(() => {
      pushFn("hello", "pushed")
    })

    expect(mockChannel.push).toHaveBeenCalledWith("hello", "pushed")
    expect(Sentry.captureMessage).toHaveBeenCalled()

    const [updatedState] = result.current

    expect(updatedState).toEqual("parsed raw")
  })
})
