import * as Sentry from "@sentry/react"
import { Channel } from "phoenix"

/** Records WebSocket disconnection details in Sentry. */
export const logSocketClose = (event?: CloseEvent): void => {
  const isPlannedClosure = event?.code === 1000

  Sentry.captureMessage(
    `WebSocket connection closed: code=${event?.code ?? "unknown"} reason="${
      event?.reason ?? ""
    }" wasClean=${event?.wasClean ?? "unknown"}`,
    {
      level: isPlannedClosure ? "info" : "warning",
      tags: {
        socket_event: "close",
        socket_code: event?.code?.toString() ?? "unknown",
        socket_clean:
          event?.wasClean !== undefined ? String(event.wasClean) : "unknown",
      },
      extra: {
        code: event?.code,
        reason: event?.reason,
        wasClean: event?.wasClean,
      },
    }
  )
}

/** Records WebSocket transport errors in Sentry. */
export const logSocketError = (error: unknown): void => {
  Sentry.captureMessage("WebSocket connection encountered an error", {
    level: "error",
    tags: {
      socket_event: "error",
    },
    extra: {
      error,
    },
  })
}

/** Records Phoenix Channel lifecycle notices in Sentry. */
export function logChannelNotice(
  topic: string,
  event: "error",
  reason?: unknown
): void
export function logChannelNotice(
  topic: string,
  event: "timeout" | "auth_expired" | "close"
): void
export function logChannelNotice(
  topic: string,
  event: "error" | "timeout" | "auth_expired" | "close",
  reason?: unknown
): void {
  const isError = event === "error"
  const isClose = event === "close"
  const level = isError ? "error" : isClose ? "info" : "warning"
  const eventLabel = event === "auth_expired" ? "auth expired" : event

  Sentry.captureMessage(`Channel ${eventLabel} on topic "${topic}"`, {
    level,
    tags: {
      channel_topic: topic,
      channel_event: event,
    },
    extra: isError ? { topic, reason } : { topic },
  })
}

/** Wraps a timeout callback to record channel timeouts in Sentry before execution. */
export const withChannelTimeoutLogging =
  (topic: string, callback: () => void): (() => void) =>
  () => {
    logChannelNotice(topic, "timeout")
    callback()
  }

/** Wraps an auth expiration callback to record expired session notices in Sentry before execution. */
export const withChannelAuthExpiredLogging =
  (topic: string, callback: () => void): (() => void) =>
  () => {
    logChannelNotice(topic, "auth_expired")
    callback()
  }

/** Attaches Sentry error and closure listeners to a Phoenix Channel instance. */
export const attachChannelLogging = (
  channel: Channel,
  topic: string
): Channel => {
  if (typeof channel.onError === "function") {
    channel.onError((reason) => {
      logChannelNotice(topic, "error", reason)
    })
  }

  if (typeof channel.onClose === "function") {
    channel.onClose(() => {
      logChannelNotice(topic, "close")
    })
  }

  return channel
}
