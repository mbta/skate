import React from "react"
import { DetourTable } from "./detourTable"

export interface Detour {
  number: number
  direction: string
  name: string
  intersection: string
  activeSince: number
}

export const DetourListPage = () => {
  const fakeData = [
    {
      number: 45,
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      number: 83,
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      number: 83,
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
    {
      number: 45,
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      number: 83,
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      number: 83,
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
    {
      number: 45,
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      number: 83,
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      number: 83,
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
  ]


  return (
    <>
      <DetourTable className="active" data={fakeData} />
      <DetourTable className="past" data={fakeData} />
    </>
  )
}
