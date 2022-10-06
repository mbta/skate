import { renderHook } from "@testing-library/react"
import { useChannel } from "../../src/hooks/useChannel"
import * as browser from "../../src/models/browser"
import { makeMockChannel, makeMockSocket } from "../testHelpers/socketHelpers"

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
