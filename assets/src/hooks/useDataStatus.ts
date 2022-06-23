import { Socket } from "phoenix"
import { useChannel } from "./useChannel"

export type DataStatus = "good" | "outage"

const parser = (status: DataStatus): DataStatus => status

const useDataStatus = (socket: Socket | undefined) => {
  return useChannel<DataStatus>({
    socket,
    topic: "data_status",
    event: "data_status",
    parser,
    loadingState: "good",
  })
}

export default useDataStatus
