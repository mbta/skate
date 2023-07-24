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
  const [results, _push_updates] = useCheckedTwoWayChannel({
    socket,
    topic,
    event,
    dataStruct,
    parser,
    loadingState,
    closeAfterFirstRead,
  })
  return results
}

export const useCheckedTwoWayChannel = <T, U, V>({
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
}): [U, (event: string, payload: V) => void] => {
  const [state, setState] = useState<U>(loadingState)
  const [joinedChannel, setJoinedChannel] = useState<Channel | undefined>()

  const onOk = useCallback(
    ({ data: data }: { data: unknown }) => {
      try {
        assert(data, dataStruct)
        setState(parser(data))
      } catch (error) {
        if (error instanceof StructError) {
          Sentry.captureException(error)
        }
      }
    },
    [dataStruct, parser, setState]
  )

  const pushUpdate = useCallback(
    (event: string, payload: any): void => {
      if (joinedChannel) {
        joinedChannel
          .push(event, payload)
          .receive("ok", (data: { data: unknown }) => {
            onOk(data)
          })
      }
    },
    [joinedChannel, onOk]
  )

  useEffect(() => {
    setState(loadingState)
    let channel: Channel | undefined
    if (socket !== undefined && topic !== null) {
      channel = socket.channel(topic)
      channel.on(event, (data: { data: unknown }) => {
        onOk(data)
      })

      channel
        .join()
        .receive("ok", (data: { data: unknown }) => {
          onOk(data)
          setJoinedChannel(channel)
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
    onOk,
  ])
  return [state, pushUpdate]
}
