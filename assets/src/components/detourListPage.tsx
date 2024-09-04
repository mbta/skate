import React, { useState } from "react"
import { DetoursTable } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button } from "react-bootstrap"
import { PlusSquare } from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"

export interface Detour {
  route: string
  direction: string
  name: string
  intersection: string
  activeSince: number
}

export const DetourListPage = () => {
  const fakeData = [
    {
      route: "45",
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      route: "83",
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      route: "83",
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
    {
      route: "45",
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      route: "83",
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      route: "83",
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
    {
      route: "45",
      direction: "Outbound",
      name: "Franklin Park via Ruggles Station",
      intersection: "John F. Kennedy St & Memorial Drive",
      activeSince: 1722372950,
    },
    {
      route: "83",
      direction: "Inbound",
      name: "Central Square",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1722361948,
    },
    {
      route: "83",
      direction: "Outbound",
      name: "Rindge Ave",
      intersection: "Pearl Street & Clearwell Ave",
      activeSince: 1721361948,
    },
  ]

  const [showDetourModal, setShowDetourModal] = useState(false)

  return (
    <div className="c-detour-list-page h-100 overflow-y-auto p-4 bg-white">
      {userInTestGroup(TestGroups.DetoursPilot) && (
        <Button
          className="c-detour-list-page__button icon-link fw-light px-3 py-2"
          onClick={() => setShowDetourModal(true)}
        >
          <PlusSquare />
          Add detour
        </Button>
      )}
      <DetoursTable data={fakeData} />
      {showDetourModal && (
        <DetourModal
          onClose={() => setShowDetourModal(false)}
          show
          originalRoute={{}}
        />
      )}
    </div>
  )
}
