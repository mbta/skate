import React, { useContext } from "react"
import { SocketContext } from "../contexts/socketContext"
import useDataStatus, { DataStatus } from "../hooks/useDataStatus"

const DataStatusBanner = (): JSX.Element | null => {
  const { socket } = useContext(SocketContext)
  const dataStatus: DataStatus = useDataStatus(socket)

  switch (dataStatus) {
    case "good":
      return null
    case "outage":
      return <Outage />
  }
}

const Outage = () => (
  <div className="c-data-status-banner c-data-status-banner--outage">
    <div className="c-data-status-banner__heading">
      Ongoing MBTA Data Outage
    </div>
    <div className="c-data-status-banner__content">
      Vehicle information may be missing or inaccurate. Thank you for your
      patience as we work to fix this issue.
    </div>
  </div>
)

export default DataStatusBanner
