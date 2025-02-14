import React, { useContext, useState } from "react"
import { DetoursTable, DetourStatus } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button, Spinner } from "react-bootstrap"
import {
  GlobeAmericas,
  LockFill,
  PeopleFill,
  PlusSquare,
  SvgProps,
} from "../helpers/bsIcons"
import { DetourModal } from "./detours/detourModal"
import { joinClasses } from "../helpers/dom"
import { useLoadDetour } from "../hooks/useLoadDetour"
import {
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../hooks/useDetours"
import { SocketContext } from "../contexts/socketContext"
import { SimpleDetour } from "../models/detoursList"

export const DetourListPage = () => {
  const [showDetourModal, setShowDetourModal] = useState(false)
  const [detourId, setDetourId] = useState<number | undefined>()

  // Wait for the detour channels to initialize
  const { socket } = useContext(SocketContext)

  const activeDetoursMap = useActiveDetours(socket)
  const draftDetoursMap = useDraftDetours(socket)
  const pastDetoursMap = usePastDetours(socket)

  const activeDetours: SimpleDetour[] | null = activeDetoursMap
    ? Object.values(activeDetoursMap).sort(
        (a, b) => b.activatedAt - a.activatedAt
      )
    : null
  const draftDetours: SimpleDetour[] | null = draftDetoursMap
    ? Object.values(draftDetoursMap).sort((a, b) => b.updatedAt - a.updatedAt)
    : null
  const pastDetours: SimpleDetour[] | null = pastDetoursMap
    ? Object.values(pastDetoursMap).sort((a, b) => b.updatedAt - a.updatedAt)
    : null
  // --- End of detour channel initialization

  const detour = useLoadDetour(detourId)

  const onOpenDetour = (detourId: number) => {
    setDetourId(detourId)
    setShowDetourModal(true)
  }

  const onCloseDetour = () => {
    setDetourId(undefined)
    setShowDetourModal(false)
  }

  return (
    <div className="c-detour-list-page h-100 overflow-y-auto p-0 p-md-4 bg-white">
      {userInTestGroup(TestGroups.DetoursPilot) && (
        <Button
          className="c-detour-list-page__button icon-link fw-light px-3 py-2 u-hide-for-mobile"
          onClick={() => setShowDetourModal(true)}
          data-fs-element="Add Detour"
        >
          <PlusSquare />
          <span className="c-detour-list-page__button-text">Add detour</span>
        </Button>
      )}
      {activeDetours && draftDetours && pastDetours ? (
        <>
          <Title
            title="Active detours"
            icon={GlobeAmericas}
            visibility="All Skate users"
            classNames={["d-flex"]}
          />
          <DetoursTable
            data={activeDetours}
            status={DetourStatus.Active}
            onOpenDetour={onOpenDetour}
            classNames={["mb-5"]}
          />
          {userInTestGroup(TestGroups.DetoursPilot) && (
            <>
              <Title
                title="Draft detours"
                icon={LockFill}
                visibility="Only you"
                classNames={["u-hide-for-mobile", "d-md-flex"]}
              />
              <DetoursTable
                data={draftDetours}
                status={DetourStatus.Draft}
                onOpenDetour={onOpenDetour}
                classNames={["mb-5", "u-hide-for-mobile"]}
              />
              <Title
                title="Closed detours"
                icon={PeopleFill}
                visibility="Dispatchers and supervisors"
                classNames={["u-hide-for-mobile", "d-md-flex"]}
              />
              <DetoursTable
                data={pastDetours}
                status={DetourStatus.Closed}
                onOpenDetour={onOpenDetour}
                classNames={["u-hide-for-mobile"]}
              />
            </>
          )}
        </>
      ) : (
        <div className="position-absolute inset-0 opacity-75 d-flex justify-content-center align-items-center">
          <Spinner />
        </div>
      )}

      {/* `detourId` exists before `stateOfDetourModal` does, so need this conditional
       * to ensure that either there's no `detourId` selected (i.e. make a new detour)
       * or the state has been successfully fetched from the api
       */}
      {showDetourModal && (!detourId || detour) && (
        <DetourModal
          onClose={onCloseDetour}
          show
          key={detourId ?? ""}
          {...(detour
            ? {
                snapshot: detour.state,
                author: detour.author,
                updatedAt: detour.updatedAt,
              }
            : { originalRoute: {} })}
        />
      )}
    </div>
  )
}

const Title = (args: {
  title: string
  icon: (props: SvgProps) => React.JSX.Element
  visibility: string
  classNames?: string[]
}) => (
  <div
    className={joinClasses([
      ...(args.classNames || []),
      "mt-3",
      "mt-md-0",
      "mb-3",
      "mx-3",
      "mx-md-0",
    ])}
  >
    <h2 className="my-auto fw-semibold fs-1 me-3 text-nowrap">{args.title}</h2>
    <args.icon className="c-detour-list-page__header-icon my-auto me-1" />
    <span className="c-detour-list-page__header-visibility my-auto">
      {args.visibility}
    </span>
  </div>
)
