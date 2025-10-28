import React, { useContext, useState } from "react"
import { DetoursTable, DetourStatus } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button, Form, Spinner } from "react-bootstrap"
import {
  GlobeAmericas,
  LockFill,
  PeopleFill,
  PlusSquare,
  SvgProps,
} from "../helpers/bsIcons"
import RoutesContext from "../contexts/routesContext"
import { DetourModal } from "./detours/detourModal"
import { joinClasses } from "../helpers/dom"
import { useLoadDetour } from "../hooks/useLoadDetour"
import {
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../hooks/useDetours"
import { SocketContext } from "../contexts/socketContext"
import { Route } from "../schedule"

export const DetourListPage = () => {
  const routes = useContext(RoutesContext)
  const [showDetourModalProps, setShowDetourModalProps] = useState<{
    show: boolean
    fromCopy: boolean
  }>({ show: false, fromCopy: false })
  const [detourId, setDetourId] = useState<number | undefined>()

  const { show: showDetourModal, fromCopy: showFromCopy } = showDetourModalProps
  const [routeId, setRouteId] = useState<string>("all")

  // Wait for the detour channels to initialize
  const { socket } = useContext(SocketContext)

  const activeDetoursMap = useActiveDetours(socket)
  const draftDetoursMap = useDraftDetours(socket)
  const pastDetoursMap = usePastDetours({ socket: socket, routeId: routeId })

  const activeDetours =
    activeDetoursMap &&
    Object.values(activeDetoursMap).sort(
      (a, b) => b.activatedAt - a.activatedAt
    )
  const draftDetours =
    draftDetoursMap &&
    Object.values(draftDetoursMap).sort((a, b) => b.updatedAt - a.updatedAt)
  const pastDetours =
    pastDetoursMap &&
    Object.values(pastDetoursMap).sort((a, b) => b.updatedAt - a.updatedAt)
  // --- End of detour channel initialization

  const { detour, isLoading: isLoadingDetour } = useLoadDetour(detourId)

  const setShowDetourModal = (show: boolean) => {
    setShowDetourModalProps({ show: show, fromCopy: false })
  }

  const onOpenDetour = (detourId: number, props = { fromCopy: false }) => {
    setDetourId(detourId)
    setShowDetourModalProps({ show: true, ...props })
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
              <div className="d-md-flex w-100">
                <div className="d-flex flex-column my-auto p-3">
                  <Form.Label htmlFor="route-name">Route</Form.Label>
                  <Form.Select
                    id="route-name"
                    onChange={(changeEvent) => {
                      setRouteId(changeEvent.target.value)
                    }}
                  >
                    <option key="" value="all">
                      Please select route
                    </option>
                    {routes?.map((route: Route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </div>
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
          onOpenDetour={onOpenDetour}
          show
          key={detourId ?? ""}
          isLoadingDetour={isLoadingDetour}
          showFromCopy={showFromCopy}
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
