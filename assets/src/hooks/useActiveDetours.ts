import { Channel, Socket } from "phoenix"
import { useChannel } from "./useChannel"
// import { DetourWithState } from "../models/detour"
import { SimpleDetour } from "../models/detoursList"
import { useEffect, useState } from "react"
import { reload } from "../models/browser"

const parser = (detour: SimpleDetour): SimpleDetour => detour

// This is to refresh the Detours List page. We need all active detours
// The problem with useChannel is that it's for a SINGLE event, but we need to respond to varied events
// export const useActiveDetours = (
//   socket: Socket | undefined
// ) => {
//   // not sure if SimpleDetour or DetourWithState
//   // probably something new
//   return useChannel<SimpleDetour | undefined>({
//     socket,
//     topic: 'detours:active',
//     event: 'detours:active',
//     parser,
//     loadingState: undefined
//   })
// }

// const subscribe = (
//   socket: Socket,
//   state: SimpleDetour[],
//   setDetours: React.Dispatch<React.SetStateAction<SimpleDetour[]>>,
// ): Channel => {
//   const topic = `detours:active`
//   const channel = socket.channel(topic)
//   console.log("state b: ", state)

//   channel.on("activated", ({ data: data }) => {
//     console.log("activated with data: ", data)
//     // console.log("activated with state: ", state)
//     // extract into reusable function
//     const detours = state.concat([data]).sort((a, b) => a.updatedAt - b.updatedAt)
//     setDetours(detours)
//   })
//   channel.on("deactivated", ({ data: data }) => {
//     console.log("deactivated with data: ", data)
//     console.log("deactivated with state: ", state)
//     // actually need to do the opposite of concat here!
//     const detours = state.filter(detour => detour.id == data.id)
//     console.log("deactivated detours: ", detours)
//     setDetours(detours)
//   })
//   channel.on("auth_expired", reload)

//   channel
//     .join()
//     .receive("ok", ({ data: data }) => {
//       // why does it keep connecting?? it shouldn't
//       console.log("connected! to topic", topic)
//       setDetours(data)
//     })

//     .receive("error", ({ reason }) => {
//       if (reason === "not_authenticated") {
//         reload()
//       } else {
//         // eslint-disable-next-line no-console
//         console.error(`joining topic ${topic} failed`, reason)
//       }
//     })
//     .receive("timeout", reload)

//   return channel
// }

// This is to refresh the Detours List page. We need all active detours
export const useActiveDetours = (
  socket: Socket | undefined
) => {
  const topic = "detours:active"
  const [state, setState] = useState<SimpleDetour[]>([])

  useEffect(() => {
    let channel: Channel | undefined
    console.log("useeffect is running. state is:", state)
    if (socket !== undefined && topic !== null) {
      channel = socket.channel(topic)
      channel.on("activated", ({ data: data }) => {
        // console.log("activated with data: ", data)
        // console.log("activated with state: ", state)
        // const detours = state.concat([data]).sort((a, b) => a.updatedAt - b.updatedAt)
        setState(state => state.concat([data]).sort((a, b) => a.updatedAt - b.updatedAt))
      })
      channel.on("deactivated", ({ data: data }) => {
        // console.log("deactivated with data: ", data)
        // console.log("deactivated with state: ", state)
        // const detours = state.filter(detour => detour.id == data.id)
        // console.log("deactivated detours: ", detours)
        setState(state => state.filter(detour => detour.id == data.id))
      })
      channel.on("auth_expired", reload)

      channel
        .join()
        .receive("ok", ({ data: data }) => {
          console.log("connected! to topic", topic)
          setState(data)
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
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket])
  return state
}

// export const useChannel = <T>({
//   socket,
//   topic,
//   event,
//   parser,
//   loadingState,
//   closeAfterFirstRead,
// }: {
//   socket: Socket | undefined
//   topic: string | null
//   event: string
//   parser: (data: any) => T
//   loadingState: T
//   closeAfterFirstRead?: boolean
// }): T => {
  
// }

// This is to refresh the Detours List page, past detours section
// export const usePastDetours = (
//   socket: Socket | undefined
// ) => {
//   return useChannel<SimpleDetour | undefined>({
//     socket,
//     topic: 'detours:active',
//     event: 'detours:active',
//     parser,
//     loadingState: undefined
//   })
// }
export const usePastDetours = (
  socket: Socket | undefined
) => {
  const loadingState = undefined
  const topic = "detours:past"
  const [state, setState] = useState<SimpleDetour | undefined>(loadingState)

  useEffect(() => {
    setState(loadingState)
    let channel: Channel | undefined
    if (socket !== undefined && topic !== null) {
      console.log(topic, ": within the useEffect")
      channel = socket.channel(topic)
      channel.on("deactivated", ({ data: data }) => {
        console.log(topic, ": within on deactivated")
        console.log(topic, ": data: ", data)
        setState(parser(data))
      })
      channel.on("auth_expired", reload)

      channel
        .join()
        .receive("ok", ({ data: data }) => {
          // why does it keep connecting?? it shouldn't
          console.log("connected! to topic", topic)
          setState(parser(data))
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
    }

    return () => {
      if (channel !== undefined) {
        channel.leave()
        channel = undefined
      }
    }
  }, [socket, topic, loadingState, parser])
  return state
}

// This is to refresh the Detours List page, just the current user drafts
export const useDraftDetours = (
  socket: Socket | undefined
) => {
  return useChannel<SimpleDetour | undefined>({
    socket,
    topic: 'detours:active',
    event: 'detours:active',
    parser,
    loadingState: undefined
  })
}

// This is to refresh icons on routeLadders
export const useDetoursForRoute = (
  socket: Socket | undefined
) => {
  return useChannel<SimpleDetour | undefined>({
    socket,
    topic: 'detours:active',
    event: 'detours:active',
    parser,
    loadingState: undefined
  })
}
