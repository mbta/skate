import { Channel, Socket } from "phoenix"
import {
  SimpleActiveDetourData,
  SimpleDetour,
  SimpleDetourData,
  simpleDetourFromActiveData,
  simpleDetourFromData,
} from "../models/detoursList"
import {
  type DetoursPagination,
  parsePaginationPayload,
} from "../models/detoursPaginationData"
import { useCallback, useEffect, useRef, useState } from "react"
import { reload } from "../models/browser"
import { userUuid } from "../util/userUuid"
import { ByRouteId, RouteId } from "../schedule"
import { equalByElements } from "../helpers/array"
import { array, create } from "superstruct"

export interface DetoursMap {
  [key: number]: SimpleDetour
}

type InitialMessageType =
  | typeof SimpleDetourData
  | typeof SimpleActiveDetourData

type SubscribeOptions = {
  socket: Socket
  topic: string
  initializeChannel: React.Dispatch<
    React.SetStateAction<DetoursMap | undefined>
  >
  initialMessageType: InitialMessageType
  onJoined?: (channel: Channel) => void
  handleDrafted?: (data: SimpleDetour) => void
  handleActivated?: (data: SimpleDetour) => void
  handleDeactivated?: (data: SimpleDetour) => void
  handleDeleted?: (detourId: number) => void
}

const subscribe = ({
  socket,
  topic,
  initializeChannel,
  handleDrafted,
  handleActivated,
  handleDeactivated,
  handleDeleted,
  initialMessageType,
  onJoined,
}: SubscribeOptions): Channel => {
  const channel = socket.channel(topic)

  if (handleDrafted)
    channel.on("drafted", ({ data: unknownData }: { data: unknown }) => {
      const data = create(unknownData, SimpleDetourData)
      handleDrafted(simpleDetourFromData(data))
    })
  if (handleActivated)
    channel.on("activated", ({ data: unknownData }: { data: unknown }) => {
      const data = create(unknownData, SimpleActiveDetourData)
      handleActivated(simpleDetourFromActiveData(data))
    })
  if (handleDeactivated)
    channel.on("deactivated", ({ data: unknownData }: { data: unknown }) => {
      const data = create(unknownData, SimpleDetourData)
      handleDeactivated(simpleDetourFromData(data))
    })
  if (handleDeleted)
    channel.on("deleted", ({ data: detourId }: { data: unknown }) => {
      if (typeof detourId === "number") {
        handleDeleted(detourId)
      }
    })
  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", ({ data: unknownData }: { data: unknown }) => {
      const data = (() => {
        switch (initialMessageType) {
          case SimpleActiveDetourData: {
            return create(unknownData, array(SimpleActiveDetourData)).map(
              simpleDetourFromActiveData
            )
          }
          case SimpleDetourData:
          default: {
            return create(unknownData, array(SimpleDetourData)).map(
              simpleDetourFromData
            )
          }
        }
      })()

      const detoursMap = Object.fromEntries(data.map((v) => [v.id, v]))
      initializeChannel(detoursMap)
      if (typeof onJoined === "function") {
        onJoined(channel)
      }
    })

    .receive("error", ({ reason }) => {
      if (reason === "not_authenticated") {
        reload()
      } else {
        // eslint-disable-next-line no-console
        console.error(`joining topic ${topic} failed`, reason)
      }
    })
    .receive("timeout", reload)

  return channel
}

// This is to refresh the Detours List page. We need all active detours
export const useActiveDetours = (
  socket: Socket | undefined,
  enable: boolean = true
) => {
  const topic = "detours:active"
  const [activeDetours, setActiveDetours] = useState<DetoursMap | undefined>()

  const handleActivated = (data: SimpleDetour) => {
    setActiveDetours((activeDetours) => ({ ...activeDetours, [data.id]: data }))
  }

  const handleDeactivated = (data: SimpleDetour) => {
    setActiveDetours((activeDetours) => {
      if (activeDetours) delete activeDetours[data.id]
      return activeDetours
    })
  }

  useEffect(() => {
    if (enable === false) {
      return
    }

    let channel: Channel | undefined
    if (socket) {
      channel = subscribe({
        socket,
        topic,
        initializeChannel: setActiveDetours,
        handleActivated: handleActivated,
        handleDeactivated: handleDeactivated,
        initialMessageType: SimpleActiveDetourData,
      })
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, enable])
  return activeDetours
}

// This is to refresh the Detours List page, past detours section
export const usePastDetours = ({
  socket,
  routeId = "all",
  limit,
  pageNumber,
  onPaginate,
}: {
  socket: Socket | undefined
  routeId: string
  limit: number
  pageNumber: number
  onPaginate?: (pagination: DetoursPagination) => void
}) => {
  const topic = routeId === "all" ? "detours:past" : `detours:past:${routeId}`
  const [pastDetours, setPastDetours] = useState<DetoursMap | undefined>()
  const channelRef = useRef<Channel | undefined>()
  const [isJoined, setIsJoined] = useState(false)
  const lastPaginateRequestRef = useRef<string | undefined>()

  const handleDeactivated = (data: SimpleDetour) => {
    setPastDetours((pastDetours) => ({ ...pastDetours, [data.id]: data }))
  }

  useEffect(() => {
    let channel: Channel | undefined
    if (socket) {
      channel = subscribe({
        socket,
        topic,
        initializeChannel: setPastDetours,
        handleDeactivated: handleDeactivated,
        initialMessageType: SimpleDetourData,
        onJoined: (channel) => {
          channelRef.current = channel
          setIsJoined(true)
        },
      })
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
        channelRef.current = undefined
        setIsJoined(false)
      }
    }
  }, [socket, topic])

  // Cache the callback to set detours from data, so that the function reference doesn't
  // change on every render. Also call the onPaginate callback to update the pagination
  // state in the parent component
  const setDetoursFromData = useCallback(
    (data: unknown) => {
      const { detours, pagination } = parsePaginationPayload(data)
      if (pagination) {
        onPaginate?.(pagination)
      }
      setPastDetours(Object.fromEntries(detours.map((detour) => [detour.id, detour])))
    },
    [onPaginate]
  )

  // Send the pagination request when page number, topic, limit changes
  useEffect(() => {
    // If the channel is not joined yet, we cannot push the pagination request
    if (!isJoined || !channelRef.current) return

    // Deduplication key to prevent multiple requests for the same page number and limit
    const key = `${topic}:${limit}:${pageNumber}`
    // If the last paginate request was for the same page number and limit, do not send
    // another request
    if (lastPaginateRequestRef.current === key) return

    // Save the current request key
    lastPaginateRequestRef.current = key
    pushPagination(
      channelRef.current,
      topic,
      limit,
      pageNumber,
      setDetoursFromData
    )
  }, [topic, pageNumber, limit, isJoined, setDetoursFromData])

  return pastDetours
}

// This is to refresh the Detours List page, just the current user drafts
export const useDraftDetours = (socket: Socket | undefined) => {
  const topic = "detours:draft:" + userUuid()
  const [draftDetours, setDraftDetours] = useState<DetoursMap | undefined>()

  const handleDrafted = (data: SimpleDetour) => {
    setDraftDetours((draftDetours) => ({ ...draftDetours, [data.id]: data }))
  }

  const handleActivated = (data: SimpleDetour) => {
    setDraftDetours((draftDetours) => {
      if (draftDetours) delete draftDetours[data.id]
      return draftDetours
    })
  }

  const handleDeleted = (detourId: number) => {
    setDraftDetours((draftDetours) => {
      if (draftDetours) delete draftDetours[detourId]
      return draftDetours
    })
  }

  useEffect(() => {
    let channel: Channel | undefined
    if (socket) {
      channel = subscribe({
        socket,
        topic,
        initializeChannel: setDraftDetours,
        handleDrafted: handleDrafted,
        handleActivated: handleActivated,
        handleDeleted: handleDeleted,
        initialMessageType: SimpleDetourData,
      })
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, topic])
  return draftDetours
}

const subscribeByRoute = (
  socket: Socket,
  topic: string,
  routeId: string,
  setDetours: React.Dispatch<React.SetStateAction<ByRouteId<DetoursMap>>>
): Channel => {
  const channel = socket.channel(topic + routeId)

  channel.on("activated", ({ data: unknownData }: { data: unknown }) => {
    const data = create(unknownData, SimpleActiveDetourData)
    setDetours((activeDetours) => ({
      ...activeDetours,
      [routeId]: {
        ...activeDetours[routeId],
        [data.id]: simpleDetourFromActiveData(data),
      },
    }))
  })
  channel.on("deactivated", ({ data: unknownData }: { data: unknown }) => {
    const data = create(unknownData, SimpleDetourData)
    setDetours((activeDetours) => {
      delete activeDetours[routeId][data.id]
      return activeDetours
    })
  })
  channel.on("auth_expired", reload)

  channel
    .join()
    .receive("ok", ({ data: unknownData }: { data: unknown }) => {
      const data = create(unknownData, array(SimpleActiveDetourData))
      const detoursMap = Object.fromEntries(
        data.map((v) => [v.id, simpleDetourFromActiveData(v)])
      )
      setDetours((detoursByRouteId) => ({
        ...detoursByRouteId,
        [routeId]: detoursMap,
      }))
    })

    .receive("error", ({ reason }) => {
      if (reason === "not_authenticated") {
        reload()
      } else {
        // eslint-disable-next-line no-console
        console.error(`joining topic ${topic} failed`, reason)
      }
    })
    .receive("timeout", reload)

  return channel
}

// This is to refresh the Route Ladders
export const useActiveDetoursByRoute = (
  socket: Socket | undefined,
  routeIds: RouteId[]
): ByRouteId<DetoursMap> => {
  const baseTopic = "detours:active:"
  const [activeDetoursByRoute, setActiveDetoursByRoute] = useState<
    ByRouteId<DetoursMap>
  >({})
  // eslint-disable-next-line react/hook-use-state
  const [, setChannelsByRouteId] = useState<ByRouteId<Channel>>({})

  const [currentRouteIds, setCurrentRouteIds] = useState<RouteId[]>(routeIds)

  if (!equalByElements(currentRouteIds, routeIds)) {
    setCurrentRouteIds(routeIds)
  }

  useEffect(() => {
    if (socket) {
      setChannelsByRouteId((oldChannelsByRoutId) => {
        const channelsByRouteId: ByRouteId<Channel> = {}

        Object.entries(oldChannelsByRoutId).forEach(([routeId, channel]) => {
          if (!currentRouteIds.includes(routeId)) {
            channel.leave()
          }
        })

        currentRouteIds.forEach((routeId) => {
          if (routeId in oldChannelsByRoutId) {
            channelsByRouteId[routeId] = oldChannelsByRoutId[routeId]
          } else {
            channelsByRouteId[routeId] = subscribeByRoute(
              socket,
              baseTopic,
              routeId,
              setActiveDetoursByRoute
            )
          }
        })

        return channelsByRouteId
      })
    }
  }, [socket, currentRouteIds])

  return activeDetoursByRoute
}

const pushPagination = (
  channel: Channel,
  topic: string,
  limit: number,
  pageNumber: number,
  setDetoursCallback: (data: unknown) => void
) => {
  const clampedPageNumber = Math.max(1, pageNumber)
  const offset = (clampedPageNumber - 1) * limit

  channel
    .push("paginate", { limit, offset })
    .receive("ok", (payload: unknown) => {
      setDetoursCallback(payload)
    })
    .receive("error", ({ reason }) => {
      // eslint-disable-next-line no-console
      console.error(`paginate failed for topic ${topic}`, reason)
    })
}
