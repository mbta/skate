import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals"
import * as Sentry from "@sentry/react"
import {
  attachChannelLogging,
  initSocketTelemetry,
  logChannelNotice,
  logSocketClose,
  logSocketError,
  withChannelAuthExpiredLogging,
  withChannelTimeoutLogging,
} from "../../src/helpers/socketSentry"

jest.mock("@sentry/react", () => ({
  __esModule: true,
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
}))

describe("socketSentry", () => {
  let teardownTelemetry: (() => void) | undefined

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    if (teardownTelemetry) {
      teardownTelemetry()
      teardownTelemetry = undefined
    }
  })

  describe("initSocketTelemetry", () => {
    test("suppresses socket and channel error messages during document unload", () => {
      teardownTelemetry = initSocketTelemetry()

      window.dispatchEvent(new Event("beforeunload"))

      logSocketClose({
        code: 1006,
        reason: "Abnormal closure",
        wasClean: false,
      } as CloseEvent)

      expect(Sentry.captureMessage).not.toHaveBeenCalled()

      logSocketError(new Error("socket failure"))
      expect(Sentry.captureMessage).not.toHaveBeenCalled()

      logChannelNotice("test:topic", "error", "error reason")
      expect(Sentry.captureMessage).not.toHaveBeenCalled()

      // Reset when pageshow occurs (e.g. navigation aborted or bfcache restored)
      window.dispatchEvent(new Event("pageshow"))

      logSocketClose({
        code: 1006,
        reason: "Abnormal closure",
        wasClean: false,
      } as CloseEvent)

      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        expect.stringContaining("WebSocket connection closed unexpectedly: code=1006"),
        expect.anything()
      )
    })
  })

  describe("logSocketClose", () => {
    test("does not log to sentry when a planned closure occurs with code 1000", () => {
      const event = {
        code: 1000,
        reason: "Normal closure",
        wasClean: true,
      } as CloseEvent
      
      logSocketClose(event)
      
      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
    
    test.each([
      {
        scenario: "an abnormal closure occurs with code 1006",
        event: {
          code: 1006,
          reason: "Server dropped",
          wasClean: false,
        } as CloseEvent,
        expectedLevel: "warning",
        expectedMessage:
          'WebSocket connection closed unexpectedly: code=1006 reason="Server dropped" wasClean=false',
        expectedCleanTag: "false",
        expectedCodeTag: "1006",
      },
      {
        scenario: "the close event is omitted",
        event: undefined,
        expectedLevel: "warning",
        expectedMessage:
          'WebSocket connection closed unexpectedly: code=unknown reason="" wasClean=unknown',
        expectedCleanTag: "unknown",
        expectedCodeTag: "unknown",
      },
    ])(
      "records disconnection details in Sentry when $scenario",
      ({
        event,
        expectedLevel,
        expectedMessage,
        expectedCleanTag,
        expectedCodeTag,
      }) => {
        logSocketClose(event)

        expect(Sentry.captureMessage).toHaveBeenCalledWith(expectedMessage, {
          level: expectedLevel,
          tags: {
            socket_event: "close",
            socket_code: expectedCodeTag,
            socket_clean: expectedCleanTag,
          },
          extra: {
            code: event?.code,
            reason: event?.reason,
            wasClean: event?.wasClean,
          },
        })
      }
    )
  })

  test("logSocketError records transport errors to Sentry", () => {
    const error = new Error("Connection failed")
    logSocketError(error)

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "WebSocket connection encountered an error",
      {
        level: "error",
        tags: { socket_event: "error" },
        extra: { error },
      }
    )
  })

  describe("logChannelNotice", () => {
    test.each([
      {
        scenario: "a channel error occurs with a reason",
        logAction: () =>
          logChannelNotice("vehicles:route:1", "error", "unauthorized"),
        expectedMessage: 'Channel error on topic "vehicles:route:1"',
        expectedLevel: "error",
        expectedTopic: "vehicles:route:1",
        expectedEvent: "error",
        expectedExtra: { topic: "vehicles:route:1", reason: "unauthorized" },
      },
      {
        scenario: "a channel join times out",
        logAction: () => logChannelNotice("alerts:route:39", "timeout"),
        expectedMessage: 'Channel timeout on topic "alerts:route:39"',
        expectedLevel: "warning",
        expectedTopic: "alerts:route:39",
        expectedEvent: "timeout",
        expectedExtra: { topic: "alerts:route:39" },
      },
      {
        scenario: "a channel session auth expires",
        logAction: () => logChannelNotice("detours:active", "auth_expired"),
        expectedMessage: 'Channel auth expired on topic "detours:active"',
        expectedLevel: "warning",
        expectedTopic: "detours:active",
        expectedEvent: "auth_expired",
        expectedExtra: { topic: "detours:active" },
      },
      {
        scenario: "a channel closes",
        logAction: () => logChannelNotice("data_status", "close"),
        expectedMessage: 'Channel close on topic "data_status"',
        expectedLevel: "info",
        expectedTopic: "data_status",
        expectedEvent: "close",
        expectedExtra: { topic: "data_status" },
      },
    ])(
      "records channel notices in Sentry when $scenario",
      ({
        logAction,
        expectedMessage,
        expectedLevel,
        expectedTopic,
        expectedEvent,
        expectedExtra,
      }) => {
        logAction()

        expect(Sentry.captureMessage).toHaveBeenCalledWith(expectedMessage, {
          level: expectedLevel,
          tags: {
            channel_topic: expectedTopic,
            channel_event: expectedEvent,
          },
          extra: expectedExtra,
        })
      }
    )
  })

  test("withChannelTimeoutLogging logs timeout notice and invokes callback", () => {
    const mockCallback = jest.fn()
    const wrapped = withChannelTimeoutLogging("topic-abc", mockCallback)

    wrapped()

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Channel timeout on topic "topic-abc"',
      expect.objectContaining({
        level: "warning",
      })
    )
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  test("withChannelTimeoutLogging works without callback", () => {
    const wrapped = withChannelTimeoutLogging("topic-abc")
    expect(() => wrapped()).not.toThrow()
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Channel timeout on topic "topic-abc"',
      expect.objectContaining({
        level: "warning",
      })
    )
  })

  test("withChannelAuthExpiredLogging logs auth expired notice and invokes callback", () => {
    const mockCallback = jest.fn()
    const wrapped = withChannelAuthExpiredLogging("topic-abc", mockCallback)

    wrapped()

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Channel auth expired on topic "topic-abc"',
      expect.objectContaining({
        level: "warning",
      })
    )
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  // TODO: decide whether to attach an onClose handler
  test("attachChannelLogging attaches onError handler", () => {
    const mockChannel = {
      onError: jest.fn(),
    } as any

    attachChannelLogging(mockChannel, "test-topic")

    expect(mockChannel.onError).toHaveBeenCalled()

    // Trigger registered callbacks
    const [errorHandler] = mockChannel.onError.mock.calls[0]
    errorHandler("fail")
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Channel error on topic "test-topic"',
      expect.objectContaining({
        extra: expect.objectContaining({ reason: "fail" }),
      })
    )
  })
})
