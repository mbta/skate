import React from "react"
import { BlockWaiver } from "../../realtime"
import BlockWaiverBanner from "./blockWaiverBanner"

interface Props {
  blockWaivers: BlockWaiver[]
}

const BlockWaiverList = ({ blockWaivers }: Props) => (
  <div className="m-block-waiver-list">
    {blockWaivers.map(blockWaiver => (
      <BlockWaiverBanner
        blockWaiver={blockWaiver}
        key={`${blockWaiver.startTime}-${blockWaiver.endTime}`}
      />
    ))}
  </div>
)

export default BlockWaiverList
