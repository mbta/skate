import { Channel, Socket } from "phoenix"
import { useCallback, useEffect, useState } from "react"
import { assert, Struct, StructError } from "superstruct"
import { reload } from "../models/browser"
import * as Sentry from "@sentry/react"

/** Opens a channel for the given topic
 *  and returns the latest data that's been pushed to it
 *
 *  Only listens for a single event
 *  Assumes the data returned on join and the data from subsequent pushes are the same format
 *  If topic is null, does not open a channel.
 */
export const useChannel = <T>({
  socket,
  topic,
  event,
  parser,
  loadingState,
  closeAfterFirstRead,
}: {
  socket: Socket | undefined
  topic: string | null
  event: string
  parser: (data: any) => T
  loadingState: T
  closeAfterFirstRead?: boolean
}): T => {
  const [state, setState] = useState<T>(loadingState)

  useEffect(() => {
    setState(loadingState)
    let channel: Channel | undefined
    if (socket !== undefined && topic !== null) {
      channel = socket.channel(topic)
      channel.on(event, ({ data: data }) => {
        setState(parser(data))
      })

      channel
        .join()
        .receive("ok", ({ data: data }) => {
          setState(parser(data))
          if (closeAfterFirstRead) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            channel!.leave()
            channel = undefined
          }
        })
        .receive("error", ({ reason }) =>
          // eslint-disable-next-line no-console
          console.error(`joining topic ${topic} failed`, reason)
        )
        .receive("timeout", reload)
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, topic, event, loadingState, parser, closeAfterFirstRead])
  return state
}

export const useCheckedChannel = <T, U>({
  socket,
  topic,
  event,
  dataStruct,
  parser,
  loadingState,
  closeAfterFirstRead,
}: {
  socket: Socket | undefined
  topic: string | null
  event: string
  dataStruct: Struct<T, any>
  parser: (data: T) => U
  loadingState: U
  closeAfterFirstRead?: boolean
}): U => {
  const [state, setState] = useState<U>(loadingState)

  useEffect(() => {
    setState(loadingState)
    let channel: Channel | undefined
    if (socket !== undefined && topic !== null) {
      channel = socket.channel(topic)
      channel.on(event, ({ data: data }: { data: unknown }) => {
        try {
          assert(data, dataStruct)

          setState(parser(data))
        } catch (error) {
          if (error instanceof StructError) {
            Sentry.captureException(error)
          }
        }
      })

      channel
        .join()
        .receive("ok", ({ data: data }: { data: unknown }) => {
          try {
            assert(data, dataStruct)

            setState(parser(data))
          } catch (error) {
            if (error instanceof StructError) {
              Sentry.captureException(error)
            }
          }

          if (closeAfterFirstRead) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            channel!.leave()
            channel = undefined
          }
        })
        .receive("error", ({ reason }) =>
          // eslint-disable-next-line no-console
          console.error(`joining topic ${topic} failed`, reason)
        )
        .receive("timeout", reload)
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [
    socket,
    topic,
    event,
    loadingState,
    dataStruct,
    parser,
    closeAfterFirstRead,
  ])
  return state
}

export const useCheckedTwoWayChannel = <T, U>({
  socket,
  topic,
  event,
  dataStruct,
  parser,
  loadingState,
  initialMessage,
}: {
  socket: Socket | undefined
  topic: string | null
  event: string
  initialMessage: any
  dataStruct: Struct<T, any>
  parser: (data: T) => U
  loadingState: U
}): [U, (event: string, payload: any) => void] => {
  const [state, setState] = useState<U>(loadingState)
  const [channel, setChannel] = useState<Channel | undefined>()

  const onOk = ({ data: data }: { data: unknown }) => {
    try {
      assert(data, dataStruct)
      setState(parser(data))
    } catch (error) {
      if (error instanceof StructError) {
        Sentry.captureException(error)
      }
    }
  }

  const pushUpdate = useCallback(
    (event: string, payload: any): void => {
      if (channel) {
        channel
          .push(event, payload)
          .receive("ok", (data: { data: unknown }) => {
            onOk(data)
          })
      }
    },
    [channel]
  )

  useEffect(() => {
    setState(loadingState)
    let channel: Channel | undefined
    if (socket !== undefined && topic !== null) {
      channel = initialMessage
        ? socket.channel(topic, initialMessage)
        : socket.channel(topic)
      channel.on(event, (data: { data: unknown }) => {
        onOk(data)
      })
      channel.onError((error) => console.log(error))

      channel
        .join()
        .receive("ok", (data: { data: unknown }) => {
          onOk(data)
          setChannel(channel)
        })
        .receive("error", ({ reason }) =>
          // eslint-disable-next-line no-console
          console.error(`joining topic ${topic} failed`, reason)
        )
        .receive("timeout", reload)
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, topic, event, loadingState, dataStruct, parser, initialMessage])
  return [state, pushUpdate]
}
