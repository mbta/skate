import { Socket } from "phoenix"
import { useChannel } from "./useChannel"

export type DataStatus = "good" | "outage"

const useDataStatus = (socket: Socket | undefined) => {
  return useChannel<DataStatus>({
    socket,
    topic: "data_status",
    event: "data_status",
    parser: (status) => status,
    loadingState: "good",
  })
}

export default useDataStatus
