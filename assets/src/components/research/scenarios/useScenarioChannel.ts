import { Channel, Socket } from "phoenix"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { SocketContext } from "../../../contexts/socketContext"
import { reload } from "../../../models/browser"
import { Scenario } from "./types"

export const DEFAULT_SCENARIOS_TOPIC = "research:scenarios:default"

export interface UseScenarioChannelOptions<
  T = unknown,
  Id extends string = string,
> {
  socket?: Socket
  topic?: string
  onScenarioTriggered?: (scenario: Scenario<T, Id>) => void
  onScenarioReset?: () => void
}

export interface UseScenarioChannelResult<
  T = unknown,
  Id extends string = string,
> {
  isConnected: boolean
  activeScenario: Scenario<T, Id> | null
  triggerScenario: (scenario: Scenario<T, Id>) => Promise<void>
  resetScenario: () => Promise<void>
}

export const useScenarioChannel = <T = unknown, Id extends string = string>(
  options: UseScenarioChannelOptions<T, Id> = {}
): UseScenarioChannelResult<T, Id> => {
  const contextSocket = useContext(SocketContext)
  const socket = options.socket ?? contextSocket?.socket
  const topic = options.topic ?? DEFAULT_SCENARIOS_TOPIC

  const [isConnected, setIsConnected] = useState(false)
  const [activeScenario, setActiveScenario] = useState<Scenario<T, Id> | null>(
    null
  )
  const channelRef = useRef<Channel | undefined>()

  const { onScenarioTriggered, onScenarioReset } = options

  useEffect(() => {
    if (!socket || !topic) {
      return
    }

    const channel = socket.channel(topic)
    channelRef.current = channel

    channel.on("scenario_triggered", ({ data }: { data: Scenario<T, Id> }) => {
      setActiveScenario(data)
      if (onScenarioTriggered) {
        onScenarioTriggered(data)
      }
    })

    channel.on("scenario_reset", () => {
      setActiveScenario(null)
      if (onScenarioReset) {
        onScenarioReset()
      }
    })

    channel.on("auth_expired", reload)

    channel
      .join()
      .receive("ok", (resp: { data?: Scenario<T, Id> | null }) => {
        setIsConnected(true)
        if (resp && resp.data) {
          setActiveScenario(resp.data)
          if (onScenarioTriggered) {
            onScenarioTriggered(resp.data)
          }
        }
      })
      .receive("error", () => {
        setIsConnected(false)
      })

    return () => {
      channel.leave()
      channelRef.current = undefined
      setIsConnected(false)
    }
  }, [socket, topic, onScenarioTriggered, onScenarioReset])

  const triggerScenario = useCallback(
    (scenario: Scenario<T, Id>): Promise<void> => {
      return new Promise((resolve, reject) => {
        const channel = channelRef.current
        if (!channel) {
          setActiveScenario(scenario)
          if (onScenarioTriggered) {
            onScenarioTriggered(scenario)
          }
          resolve()
          return
        }

        channel
          .push("trigger_scenario", scenario)
          .receive("ok", () => {
            setActiveScenario(scenario)
            resolve()
          })
          .receive("error", (err) => reject(err))
          .receive("timeout", () =>
            reject(new Error("Broadcast push timed out"))
          )
      })
    },
    [onScenarioTriggered]
  )

  const resetScenario = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const channel = channelRef.current
      if (!channel) {
        setActiveScenario(null)
        if (onScenarioReset) {
          onScenarioReset()
        }
        resolve()
        return
      }

      channel
        .push("reset_scenario", {})
        .receive("ok", () => {
          setActiveScenario(null)
          resolve()
        })
        .receive("error", (err) => reject(err))
        .receive("timeout", () => reject(new Error("Reset push timed out")))
    })
  }, [onScenarioReset])

  return {
    isConnected,
    activeScenario,
    triggerScenario,
    resetScenario,
  }
}
